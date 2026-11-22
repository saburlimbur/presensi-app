# Presensi App

Sistem presensi karyawan berbasis **face recognition** dan **geofencing**. Karyawan absen lewat selfie yang diverifikasi CNN di server, dengan validasi posisi GPS terhadap radius kantor. Dilengkapi manajemen shift, pengajuan izin yang terhubung ke saldo cuti, laporan Excel, dan notifikasi realtime.

Repo ini monorepo berisi dua aplikasi:

| Folder | Isi |
| :-- | :-- |
| [`apps/api`](apps/api) | REST API: Express 5, Prisma, PostgreSQL, face-api.js |
| [`apps/web`](apps/web) | PWA karyawan: React 19, TypeScript, Vite |

| Dokumen | Isi |
| :-- | :-- |
| [apps/api/SETUP.md](apps/api/SETUP.md) | Setup server: env per-mode, Docker, migrasi ke Supabase, troubleshooting |
| [apps/api/docs/API.md](apps/api/docs/API.md) | Kontrak REST API per module, termasuk realtime (SSE) |
| [apps/api/prisma/schema.prisma](apps/api/prisma/schema.prisma) | **Sumber kebenaran skema database** |
| `/api-docs` | Dokumentasi OpenAPI (Swagger UI), jalan saat server hidup |

---

## Menjalankan

Butuh Node.js 20+ dan PostgreSQL 16 (atau Docker).

```bash
# 1. Siapkan env dulu; install api menjalankan prisma generate yang membaca DATABASE_URL
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# 2. Install semua dependensi dari root
npm install

# 3. Siapkan database
npm run prisma:migrate -w presensi-api
npm run prisma:seed -w presensi-api

# 4. Jalankan api dan web sekaligus
npm run dev
```

Api jalan di `http://localhost:3000`, web di `http://localhost:5174`.

| Script | Fungsi |
| :-- | :-- |
| `npm run dev` | Api dan web sekaligus |
| `npm run dev:api` | Api saja |
| `npm run dev:web` | Web saja |
| `npm run build` | Typecheck dan build web |
| `npm run lint` | ESLint web |
| `npm run test` | Test api dan web (`test:api`, `test:web` untuk salah satu) |

## Struktur

```
presensi-app/
├── apps/
│   ├── api/
│   │   ├── prisma/        schema, migrasi, seed
│   │   ├── public/models/ bobot face-api.js
│   │   ├── src/
│   │   │   ├── config/  lib/  middleware/  routes/  utils/
│   │   │   ├── docs/      definisi Swagger
│   │   │   └── modules/   satu folder per domain (controller, service,
│   │   │                  repository, model, routes)
│   │   └── tests/
│   └── web/
│       └── src/
│           ├── features/  satu folder per fitur (api, components, hooks, pages)
│           └── shared/    kode lintas fitur
└── package.json           npm workspaces
```

## Alur Absensi

1. Web mengirim selfie ke `POST /faces/recognize`. Kalau wajah cocok dengan user yang login, server mengembalikan `verificationToken` yang berlaku 5 menit dan hanya bisa dipakai sekali.
2. Web membaca lokasi perangkat dan membandingkannya dengan radius kantor terdekat.
3. Web memanggil `POST /attendance/check-in` (atau `check-out`) dengan koordinat dan token tadi sebagai `faceToken`. Server menolak permintaan tanpa token yang sah.

## Stack Frontend (`apps/web`)

| Kategori | Teknologi |
| :-- | :-- |
| UI | React 19, TypeScript, Tailwind CSS, komponen gaya shadcn |
| Routing & data | React Router 7, TanStack Query 4, Zustand |
| Form | React Hook Form, Zod |
| Peta | Leaflet, React Leaflet |
| PWA | `vite-plugin-pwa` (precache aset, tanpa cache respons API) |

---

## Identitas Proyek

| Field | Informasi |
| :---- | :-------- |
| **Tujuan** | Sistem absensi menggunakan Face Recognition dan Geofencing |
| **Teknologi** | Machine Learning (CNN), Geolocation, dan Biometric Verification |

---

## Stack Backend (`apps/api`)

| Kategori | Teknologi | Deskripsi |
| :-- | :-- | :-- |
| Runtime | `Node.js 20 (ES Modules)` | Docker image `node:20-slim`; proyek memakai `"type": "module"`. |
| Framework | `Express.js 5.x` | Web framework minimalis untuk RESTful API. |
| Database | `PostgreSQL 16` | Lokal saat dev, Supabase saat production. |
| ORM | `Prisma 7` + `@prisma/adapter-pg` | Schema-first, migrasi, query type-safe. |
| Object Storage | `Supabase Storage` | Foto wajah, foto profil, lampiran izin — lihat [Penyimpanan Berkas](#penyimpanan-berkas). |
| Kontainerisasi | `Docker + Docker Compose` | Orkestrasi `app` + `db`, hot-reload via bind-mount. |
| AI / ML | `face-api.js`, `@tensorflow/tfjs` | Pipeline CNN: detection, alignment, 128-d descriptor. |
| Image Canvas | `@napi-rs/canvas` | Prebuilt N-API binding, lebih ringan dari `node-canvas`, cocok untuk server CPU-only. |
| Autentikasi | `jsonwebtoken`, `bcrypt` | JWT access + refresh token, hashing password. |
| Keamanan | `Helmet`, `CORS` | Pengetatan HTTP header, CORS multi-origin + wildcard. |
| Rate Limit | `express-rate-limit` | Throttle global + khusus endpoint auth (anti brute-force). |
| Validasi | `Joi 18` | Validasi schema untuk body, query, dan params. |
| File Upload | `Multer` | Handler multipart form-data. |
| Geofencing | `Geolib` + Haversine custom | Jarak GPS user ↔ koordinat kantor, validasi radius. |
| Tanggal / Timezone | `dayjs`, `cross-env`, `utils/date` | Normalisasi TZ Asia/Jakarta lintas OS. |
| Logging | `Winston`, `winston-daily-rotate-file`, `Morgan` | Log terstruktur dengan rotasi harian + log akses HTTP. |
| Export Excel | `ExcelJS` | Generate `.xlsx` untuk laporan absensi bulanan. |
| QR Code | `qrcode` | Generator QR untuk metode absensi `QR_CODE`. |
| Realtime | SSE (Server-Sent Events) | Broadcast notifikasi via `EventSource`. |
| Email | `nodemailer` (SMTP) | Reset password. |
| Testing | `Vitest 4` | 151 unit test, Prisma di-mock — tidak butuh database. |
| Dev Tools | `node --watch`, `express-list-endpoints` | Hot-reload + `npm run route:list`. |

---

## Arsitektur Face Recognition

Tiga model CNN pre-trained dari `face-api.js` (di atas TensorFlow.js), masing-masing dengan peran spesifik:

| No | Model | Arsitektur | Input | Output | Fungsi |
|:--:|:--|:--|:--|:--|:--|
| 1 | **Tiny Face Detector** | Tiny Yolo v2 | Citra mentah (resize 320×320) | Bounding box + confidence | **Face Detection** — mendeteksi dan meng-crop area wajah. |
| 2 | **Face Landmark 68 Net** | CNN ringan (regresi) | Area wajah hasil crop | 68 koordinat landmark | **Face Alignment** — menormalkan orientasi wajah sebelum ekstraksi. |
| 3 | **Face Recognition Net** | ResNet-34 (adopsi dlib) | Wajah ter-align | Vektor float 128 dimensi | **Face Embedding** — representasi numerik identitas wajah. |

### Kenapa Tiny Face Detector, bukan SSD MobileNet V1?

| Aspek | SSD MobileNet V1 | Tiny Face Detector |
|:--|:--|:--|
| Arsitektur | MobileNetV1 + SSD | Tiny Yolo v2 |
| Ukuran model | ~5.4 MB | ~190 KB |
| Kecepatan (CPU) | ~20 detik per gambar | ~1–3 detik per gambar |
| Cocok untuk | Environment dengan GPU | Server CPU-only / realtime |

Server berjalan di environment **CPU-only** tanpa akselerasi GPU, dan Tiny Yolo v2 memang dioptimasi untuk inferensi cepat pada resource terbatas. Kualitas deteksinya tetap memadai untuk enrollment terkontrol dan selfie absensi.

> Referensi: [face-api.js — Tiny Face Detector](https://github.com/justadudewhohacks/face-api.js#tiny-face-detector)

### Alur Pipeline

```
Citra Input
    │
    ▼
┌──────────────────────┐
│  Tiny Face Detector  │  → lokasi wajah (bounding box)
│  (Tiny Yolo v2)      │  → inputSize: 320, scoreThreshold: 0.5
└────────┬─────────────┘
         │ wajah hasil crop
         ▼
┌──────────────────────┐
│ Face Landmark 68 Net │  → 68 titik kunci wajah
│ (Face Alignment)     │  → normalisasi pose/orientasi
└────────┬─────────────┘
         │ wajah ter-align
         ▼
┌──────────────────────┐
│  ResNet-34           │  → Face Descriptor 128 dimensi
│  (Face Recognition)  │  → contoh: [0.0423, -0.1274, ..., 0.0891]
└──────────────────────┘
```

Inferensi dijalankan di **worker pool** terpisah (`src/modules/faces/face-pool.js`) supaya proses CNN yang berat tidak memblokir event loop Express.

### File Model

Semua bobot ada di `apps/api/public/models/`, diambil dari [repository resmi face-api.js](https://github.com/justadudewhohacks/face-api.js/tree/master/weights).

| Model | File Bobot | Ukuran |
|:--|:--|:--|
| Tiny Face Detector | `tiny_face_detector_model-weights_manifest.json`, `…-shard1` | ~190 KB |
| Face Landmark 68 | `face_landmark_68_model-weights_manifest.json`, `…-shard1` | ~350 KB |
| Face Recognition (ResNet-34) | `face_recognition_model-weights_manifest.json`, `…-shard1`, `…-shard2` | ~6.2 MB |

---

## Logika Absensi Biometrik

Angka-angka di bawah ini adalah konstanta nyata di `src/modules/faces/face.service.js`.

### 1. Enrollment (Multi-Photo)

Setiap user mengunggah **3 sampai 10 foto** dengan sudut/ekspresi berbeda. Tiap foto menghasilkan satu embedding yang disimpan sebagai baris terpisah di `face_embeddings`. Menyimpan banyak embedding — bukan satu vektor rata-rata — mempertahankan variasi wajah dan menaikkan akurasi.

Foto baru ditolak kalau Euclidean distance-nya **< 0.15** terhadap embedding yang sudah ada (`DUPLICATE_THRESHOLD`), supaya tidak ada data redundan.

### 2. Few-Shot Learning

Dengan 3–10 sampel referensi per user, model tidak perlu dilatih ulang saat ada karyawan baru — embedding cukup di-insert dan cache in-memory (TTL 5 menit) di-refresh.

### 3. Verifikasi & Thresholding

Saat absensi, descriptor dari selfie (*probe image*) dibandingkan ke **seluruh** embedding tersimpan memakai Euclidean distance. Identitas ditentukan oleh jarak terkecil, dan pencocokan dianggap valid kalau:

- **Jarak < 0.5** (`RECOGNITION_THRESHOLD`), dan
- **Selisih terhadap kandidat runner-up ≥ 0.05** (`AMBIGUITY_MARGIN`).

Syarat kedua yang bikin sistem menolak, bukan menebak, saat dua orang mirip sama-sama mendekat. Tanpa itu, wajah asing bisa lolos ke user terdekat hanya karena kebetulan jaraknya paling kecil.

Confidence dihitung: `confidence = (1 - distance / 0.5) × 100%`.

---

## Alur Pengajuan Izin & Integrasi Saldo Cuti

Modul `permissions` terhubung penuh dengan `leave_balances` dan `attendances`.

### 1. Submit — Karyawan

`POST /permissions/request` dengan `type`, `startDate`, `endDate`, opsional `reason` + lampiran.

- `duration` dihitung inclusive dari rentang tanggal.
- **Pre-check saldo** untuk type yang menarik kuota: ditolak di gerbang submit kalau `remainingDays < duration`. Fail fast, biar tidak ada antrian approval yang sudah pasti gagal.
- Persist dengan `status=PENDING`, kirim notif `PERMISSION_SUBMITTED` ke semua admin via SSE.

### 2. Approve — Admin (Atomic Transaction)

`PATCH /permissions/:id/approve`. Tiga operasi dalam **satu** `prisma.$transaction`:

1. **Deduct saldo** (kalau type menarik kuota) — `updateMany` dengan filter `remainingDays >= duration`. Dua admin approve paralel untuk user yang sama tidak akan over-deduct.
2. **Update status** PENDING → APPROVED — `updateMany` dengan filter `status='PENDING'`. Dua admin approve izin yang sama: satu sukses, satu dapat `409 CONFLICT`.
3. **Materialize attendance** — `createMany` + `skipDuplicates` untuk type *leave-like*.

Kalau salah satu gagal, seluruh transaksi rollback — tidak ada saldo bocor atau permission approved tanpa attendance. Notif `PERMISSION_APPROVED` di-emit setelah commit.

### 3. Reject — Admin

`PATCH /permissions/:id/reject` — race-guard via `updateMany`, tidak menyentuh saldo maupun attendance.

### 4. Cancel — Karyawan

`PATCH /permissions/:id/cancel` (karyawan, **bukan** admin). Membatalkan izinnya sendiri selama masih `PENDING`. Izin milik orang lain dibalas `404`, bukan `403`, supaya keberadaannya tidak bocor. Karena izin pending belum menyentuh saldo, tidak ada refund.

### Mapping Type → Status Attendance

| Permission Type | Attendance Status | Auto-create row? | Potong Saldo |
|:--|:-:|:-:|:-:|
| `SICK` | `SICK` | ✓ | — |
| `PERMIT`, `OTHER` | `PERMIT` | ✓ | — |
| `ANNUAL_LEAVE`, `MATERNITY_LEAVE`, `PATERNITY_LEAVE`, `MARRIAGE_LEAVE`, `BEREAVEMENT` | `ON_LEAVE` | ✓ | ✓ |
| `WORK_FROM_HOME` | `WORK_FROM_HOME` (saat check-in) | ✗ | — |
| `HALF_DAY` | `PRESENT` + metadata `halfDay:true` (saat check-in) | ✗ | — |

WFH dan HALF_DAY tidak di-materialize karena user tetap check-in sendiri.

### Idempotency & Race-Safety

- Unique `(userId, date)` di `attendances` + `skipDuplicates` → hari yang sudah punya attendance (mis. user terlanjur check-in sebelum admin approve) **dipertahankan**, tidak ter-overwrite. Hari yang di-skip di-log warn.
- Unique `(userId, year)` di `leave_balances` + `initForUser` yang race-tolerant → dua approval paralel tidak crash saat saldo tahun berjalan belum ter-init.
- `GET /leave-balances/my-balance` self-heal: kalau user query tahun berjalan dan belum punya row, auto-init dengan kuota default 12 hari.

---

## Penyimpanan Berkas

Foto wajah, foto profil, dan lampiran izin disimpan di **Supabase Storage**, bukan di disk server. Yang masuk database adalah **key**-nya, bukan URL.

| Bucket | Isi | Mime |
|:--|:--|:--|
| `faces` | `users/…` — foto enrollment wajah | jpeg, png |
| `profiles` | foto profil karyawan | jpeg, png |
| `permissions` | lampiran pengajuan izin | pdf, doc, docx |

Ketiganya **privat**. Server membuat *signed URL* ber-TTL 1 jam saat data dibaca, dan mengirimnya di field terpisah berakhiran `_url` (`imageUrl_url`, `profilePhoto_url`, `attachmentUrl_url`). Kolom aslinya tetap berisi key.

Konsekuensinya: **frontend harus memakai field `_url`, bukan kolom aslinya** — key mentah bukan alamat yang bisa dibuka. Dan karena Postgres dan Storage itu dua sistem terpisah, reset database tidak menghapus objek di bucket; pakai `npm run storage:purge` untuk membersihkan file yatim.

Foto absensi (`photoIn`, `photoOut`, `watermarkedIn`, `watermarkedOut`) masih di disk lokal dan disajikan lewat `URL_ASSETS_ATTENDANCE`.

---

## Model Data

Skema lengkap beserta tipe, index, dan constraint ada di **[`prisma/schema.prisma`](apps/api/prisma/schema.prisma)** — itu sumber kebenarannya. Di bawah ini ringkasan perannya saja, supaya dokumen ini tidak basi setiap kali ada migration.

| Model | Tabel | Peran |
| :-- | :-- | :-- |
| `Department` | `departments` | Master departemen; punya relasi kepala departemen. |
| `User` | `users` | Akun karyawan/admin + kredensial. |
| `FaceEmbedding` | `face_embeddings` | Face descriptor 128-d (banyak per user). |
| `Shift` | `shifts` | Master shift: jam mulai, selesai, grace period. Pola **single-active** — hanya satu baris `isActive=true` yang jadi jadwal global. |
| `AttendanceLocation` | `attendance_locations` | Titik kantor + radius geofence. Soft-delete (`deletedAt`) supaya referensi historis tidak putus. |
| `Attendance` | `attendances` | Catatan check-in/out, metode, work mode, GPS, foto, metadata. |
| `Permission` | `permissions` | Pengajuan izin + audit trail keputusan admin. |
| `LeaveBalance` | `leave_balances` | Saldo cuti tahunan per karyawan per tahun. |
| `Report` | `reports` | Laporan administratif yang di-generate. |
| `Notification` | `notifications` | Notifikasi in-app, dikirim realtime via SSE. |
| `AuditLog` | `audit_logs` | Jejak aksi admin. |
| `UserPasswordReset` | `user_password_resets` | Token reset password. |
| `UserRefreshToken` | `user_refresh_tokens` | Refresh token aktif per user. |

### Relasi

| Sumber | Tujuan | Relasi |
|:--|:--|:--|
| `departments` | `users` | One-to-Many |
| `departments` | `users` (head) | One-to-One |
| `users` | `face_embeddings` | One-to-Many |
| `users` | `attendances` | One-to-Many |
| `users` | `permissions` | One-to-Many |
| `users` (approver) | `permissions` | One-to-Many |
| `users` | `leave_balances` | One-to-Many |
| `users` | `reports` | One-to-Many |
| `users` | `audit_logs` | One-to-Many |
| `users` | `notifications` | One-to-Many |
| `users` | `user_password_resets` | One-to-Many |
| `users` | `user_refresh_tokens` | One-to-Many |
| `permissions` | `attendances` | One-to-Many |

> Relasi `attendances ↔ work_schedules` dan tabel `user_schedules` sudah **dihapus**. Jadwal sekarang memakai pola single-active shift global, dan `attendance.shiftName` di-snapshot saat check-in alih-alih FK ke shift.

### Enum

| Enum | Nilai |
|:--|:--|
| `Role` | `ADMIN`, `EMPLOYEE` |
| `Position` | `DIRECTOR`, `MANAGER`, `SUPERVISOR`, `TEAM_LEAD`, `SENIOR_STAFF`, `STAFF`, `JUNIOR_STAFF`, `HR_SPECIALIST`, `FINANCE_SPECIALIST`, `IT_SPECIALIST`, `MARKETING_SPECIALIST`, `INTERN`, `CONTRACT`, `OTHER` |
| `ShiftName` | `MORNING`, `AFTERNOON`, `NIGHT`, `FULL_DAY`, `SPLIT_SHIFT`, `FLEXIBLE` |
| `AttendanceStatus` | `PRESENT`, `LATE`, `ABSENT`, `SICK`, `PERMIT`, `ON_LEAVE`, `HOLIDAY`, `WORK_FROM_HOME` |
| `AttendanceMethod` | `QR_CODE`, `FACE_RECOGNITION`, `MANUAL`, `MOBILE_APP` |
| `WorkMode` | `WFO`, `WFA` |
| `PermissionType` | `SICK`, `PERMIT`, `ANNUAL_LEAVE`, `MATERNITY_LEAVE`, `PATERNITY_LEAVE`, `MARRIAGE_LEAVE`, `BEREAVEMENT`, `HALF_DAY`, `WORK_FROM_HOME`, `OTHER` |
| `PermissionStatus` | `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED` |
| `NotificationType` | `ATTENDANCE_REMINDER`, `ATTENDANCE_CHECK_IN`, `ATTENDANCE_CHECK_OUT`, `PERMISSION_SUBMITTED`, `PERMISSION_APPROVED`, `PERMISSION_REJECTED`, `ANNOUNCEMENT`, `SYSTEM` |

---

## Testing

```bash
npm test              # test api (Vitest)
npm run test:coverage -w presensi-api # laporan coverage
```

Seluruh test memakai `vi.mock` untuk Prisma, jadi **tidak butuh database** — bisa jalan di CI tanpa service container. Yang dibutuhkan cuma `DATABASE_URL` terisi apa saja, karena `loadEnv.js` sengaja gagal cepat kalau kosong.
