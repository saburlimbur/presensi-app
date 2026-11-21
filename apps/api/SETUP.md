# Setup & Development Guide

Panduan praktis untuk menjalankan backend **Attendance Management System** di local.
Untuk dokumentasi skema database dan arsitektur model CNN, lihat [README.md](../../README.md).

---

## Prasyarat

| Tool | Versi Minimal | Catatan |
|---|---|---|
| Node.js | 20.x | Runtime utama. |
| PostgreSQL | 16.x | Install native di host. Alternatif: pakai [Docker](#menjalankan-lewat-docker-opsional). |
| Git | any | Clone repo ini. |

---

## Quick Start (5 langkah)

```bash
# 1. Clone + masuk folder
git clone <repo-url>
cd presensi-app/apps/api

# 2. Copy env template
cp .env.example .env
# Edit .env — minimal set DATABASE_URL & DIRECT_URL ke Postgres lokal:
#   DATABASE_URL="postgresql://postgres:<password>@localhost:5432/attendance?schema=public"
#   DIRECT_URL="postgresql://postgres:<password>@localhost:5432/attendance?schema=public"
# Ganti juga JWT_SECRET & JWT_REFRESH_SECRET.

# 3. Install deps (prisma generate jalan otomatis via postinstall)
npm install

# 4. Bikin schema DB
npx prisma migrate deploy

# 5. Seed data awal
npm run prisma:seed
```

Jalankan: `npm run dev` → server siap di `http://localhost:3000`.

**Kredensial admin default** (dari `prisma/seed.js`):
- Email: `hr@example.com`
- Password: `admin123`
- Role: `ADMIN`

> Pastikan database `attendance` sudah dibuat sebelum step 4:
> `psql -U postgres -c "CREATE DATABASE attendance;"`

---

## Workflow Harian

| Aksi | Command |
|---|---|
| Start server (hot reload) | `npm run dev` |
| Cek sinkronisasi migration | `npx prisma migrate status` |
| Apply migration yang belum jalan | `npx prisma migrate deploy` |
| Seed ulang data baseline | `npm run prisma:seed` |
| Buka DB GUI | `npm run prisma:studio` |
| Lihat semua route | `npm run route:list` |
| Test | `npm test` |
| Reset DB (⚠ drop semua tabel + auto-seed) | `npx prisma migrate reset` |

### Hot reload

`npm run dev` pakai nodemon — edit file di `src/` → auto-restart. Yang perlu `npm install` ulang cuma
kalau `package.json` berubah.

### Prisma — edit schema DB

```bash
# 1. Edit prisma/schema.prisma
# 2. Generate migration + apply + regenerate client
npx prisma migrate dev --name <nama_migrasi>
```

### Akses database

```bash
psql "$DATABASE_URL"     # CLI
npm run prisma:studio    # GUI → http://localhost:5555
```

> `prisma:studio` di `package.json` masih hardcode URL local. Kalau `.env`-mu sudah pindah ke Supabase,
> jalankan `npx prisma studio` saja (tanpa `--url`) supaya ikut `prisma.config.js`.

---

## Menjalankan lewat Docker (opsional)

Jalur alternatif kalau tidak mau install Postgres native. `docker-compose.yml` sudah menyediakan
Postgres 16 + app dengan hot-reload.

> Butuh Docker Desktop 4.x, RAM minimal **4 GB** (Settings → Resources → Memory) untuk compile
> bcrypt & load face-api model.

```bash
docker compose up -d --build          # first build ~3-7 menit
docker compose logs -f app            # tunggu "SERVER RUNNING ON PORT: 3000"
docker compose exec app npm run prisma:seed
```

| Aksi | Command |
|---|---|
| Start / stop | `docker compose up -d` / `docker compose stop` |
| Restart app saja | `docker compose restart app` |
| Log realtime | `docker compose logs -f app` |
| Shell ke container | `docker compose exec app sh` |
| Rebuild (`package.json`/`Dockerfile` berubah) | `docker compose up -d --build` |
| PSQL | `docker compose exec db psql -U postgres -d attendance` |
| Migration | `docker compose exec app npx prisma migrate dev --name <nama>` |
| Reset total (⚠ hapus volume DB) | `docker compose down -v` |

Bedanya dengan jalur native: `docker-compose.yml` **override `DATABASE_URL`** ke host `db:5432`
(bukan `localhost`), karena container app bicara ke container db lewat jaringan internal compose.
Nilai `DATABASE_URL` di `.env` diabaikan untuk container app.

---

## Environment Variables

File `.env` dibuat dari `.env.example`. Yang penting:

| Variable | Nilai Dev | Keterangan |
|---|---|---|
| `APP_PORT` | `3000` | Port backend di host |
| `DATABASE_URL` | `postgresql://postgres:secret@localhost:5432/attendance?schema=public` | Connection runtime app. Jalur Docker override ke `@db:5432`. |
| `DIRECT_URL` | sama dengan `DATABASE_URL` | Dipakai `prisma migrate` & `studio`. Baru beda dari `DATABASE_URL` kalau pakai Supabase (pooler vs session) |
| `JWT_SECRET` | *(ubah!)* | Secret signing access token |
| `JWT_REFRESH_SECRET` | *(ubah!)* | Secret signing refresh token |
| `CORS_ORIGIN` | `http://localhost:5174,http://localhost:3000` | Multi-origin pisah koma. `*` = allow all (dev only) |
| `MAX_FILE_SIZE` | `5242880` | 5 MB per file upload wajah |
| `SUPABASE_URL` | `https://<ref>.supabase.co` | Project URL — **Storage saja**, bukan Postgres |
| `SUPABASE_SERVICE_ROLE_KEY` | *(dari dashboard)* | ⚠️ Bypass RLS. Server-side saja — jangan masuk bundle frontend |
| `SUPABASE_BUCKET_FACES` | `faces` | Bucket foto wajah |
| `SUPABASE_BUCKET_DOCS` | `permissions` | Bucket dokumen izin |

> **Siapa baca apa:** `prisma.config.js` jadi sumber URL untuk Migrate/Studio — dia pakai `DIRECT_URL`
> kalau ada, fallback `DATABASE_URL`. Runtime app **tidak** baca file itu; lihat `src/lib/prisma.js`
> yang pakai adapter `PrismaPg` langsung dari `DATABASE_URL`.

---

## Arsitektur Data: Postgres ≠ Supabase Storage

Project ini pakai **dua penyimpanan yang terpisah total**:

| Penyimpanan | Isi | Dikontrol oleh |
|---|---|---|
| **Postgres** (`DATABASE_URL`) | Semua tabel relasional — `users`, `attendances`, `face_embeddings`, dst. | Prisma (`migrate`, `seed`) |
| **Supabase Storage** (`SUPABASE_URL`) | File biner — bucket `faces` (foto wajah) & `permissions` (dokumen izin) | `src/lib/storage.js` |

Yang sering bikin salah paham: **Supabase di project ini dipakai untuk Storage saja, bukan untuk Postgres.**
`DATABASE_URL` default menunjuk Postgres lokal. Blok Supabase Postgres di `.env.example` masih
dikomentari (rencana production — lihat [Pindah Postgres ke Supabase](#pindah-postgres-ke-supabase)).

### Konsekuensi: reset DB tidak menyentuh bucket

`prisma migrate reset` cuma drop & recreate schema Postgres. **Prisma tidak tahu-menahu soal Storage** —
file di bucket tetap utuh. Hasilnya **file orphan**: ada di bucket, tapi tidak ada row yang menunjuk ke sana.

Bucket hanya dibersihkan lewat `removeObject()` di `src/lib/storage.js`, yang dipanggil dari flow aplikasi
(reset wajah, hapus user) — **bukan** dari migrate. Jadi kalau habis reset DB mau bersih, hapus manual
isi bucket lewat dashboard Supabase (Storage → pilih bucket → select → delete).

### Seed tidak pernah upload ke bucket

`prisma/seed.js` cuma bikin **3 hal**: `department`, `user` (admin default), dan `attendanceLocation`.
Nol upload file. Jadi:

| Aksi | Postgres | Bucket Supabase |
|---|---|---|
| `prisma migrate reset` | ✅ drop semua tabel, re-apply migration, auto-seed | ❌ tidak tersentuh |
| `npm run prisma:seed` | ✅ isi 3 tabel baseline | ❌ tidak tersentuh |
| `POST /faces/enroll` (dari app) | ✅ insert `face_embeddings` | ✅ upload foto |
| Hapus file manual di dashboard | ❌ tidak tersentuh | ✅ terhapus |

**Foto wajah hanya lahir dari `/faces/enroll`, tidak pernah dari seed.** Kalau bucket dikosongkan,
seeding **tidak** akan mengembalikannya — user harus enroll ulang lewat app.

Yang penting: **target seed = `DATABASE_URL`.** Kalau `.env` masih menunjuk localhost, seed masuk ke
Postgres lokal — Supabase tidak dapat apa-apa, baik DB maupun bucket.

Cek isi bucket cepat:

```bash
node -e "require('dotenv').config();const{createClient}=require('@supabase/supabase-js');const s=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);s.storage.from('faces').list('users').then(r=>console.log((r.data?.length??0)+' file'))"
```

Bandingkan dengan jumlah row-nya — kalau `face_embeddings` nol tapi bucket ada isinya, itu orphan:

```bash
npx prisma studio    # atau: psql "$DATABASE_URL" -c 'select count(*) from face_embeddings'
```

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` bypass semua RLS. **Server-side saja** — jangan pernah masuk ke
> bundle frontend (di Vercel: jangan pakai prefix `VITE_`).

---

## Pindah Postgres ke Supabase

Berguna kalau app dipakai di lebih dari satu device: Postgres lokal itu **per-device**, jadi tiap device
harus migrate + seed sendiri. Supabase bikin DB jadi shared — konsisten dengan bucket yang memang
sudah shared.

### 1. Ambil connection string

Dashboard Supabase → **Settings → Database → Connection string**. Butuh dua-duanya:

| Var | Mode | Port | Dipakai untuk |
|---|---|---|---|
| `DATABASE_URL` | Transaction pooler | `6543` | Runtime app (`?pgbouncer=true`) |
| `DIRECT_URL` | Session | `5432` | `prisma migrate` & `studio` |

`DIRECT_URL` **wajib** — pooler transaction mode tidak support prepared statement & advisory lock
yang dibutuhkan migration.

> Password Postgres **berbeda** dari `SUPABASE_SERVICE_ROLE_KEY`. Service role key itu JWT untuk
> REST/Storage API, tidak bisa dipakai konek Postgres.
> URL-encode password kalau ada char khusus: `@` → `%40`, `#` → `%23`.

### 2. Cek dulu — jangan langsung deploy

```bash
npx prisma migrate status
```

**Baca dulu baris pertama output-nya** — pastikan host yang tertulis benar-benar Supabase, bukan
`localhost`. Ini pengaman paling penting sebelum command destruktif:

```
Datasource "db": PostgreSQL database "postgres", schema "public" at "aws-1-xxx.pooler.supabase.com:5432"
```

| Output | Artinya | Aksi |
|---|---|---|
| `Database schema is up to date!` | Sudah sinkron | Tidak perlu apa-apa |
| Semua migration `not yet applied` | DB kosong | Aman lanjut ke step 3 |
| `P3005 — database schema is not empty` | Tabel sudah ada tapi **tanpa `_prisma_migrations`** — schema dibuat lewat `db push`/SQL manual, bukan `migrate` | Lihat [Kasus: schema ada tanpa riwayat migration](#kasus-schema-ada-tanpa-riwayat-migration) |
| Ada drift / migration hilang | Schema menyimpang | **Jangan** `migrate reset` kalau DB ada isinya — reset = drop semua tabel |

### 3. Apply + isi data

```bash
npx prisma migrate deploy   # bikin schema — TIDAK bawa data
npm run prisma:seed         # baseline fresh
```

> **Schema ≠ data.** `migrate deploy` cuma bikin tabel kosong. Kalau isi Postgres lama mau ikut pindah,
> pakai dump — bukan seed:
> ```bash
> pg_dump --data-only --no-owner "postgresql://postgres:***@localhost:5432/attendance" > data.sql
> psql "<DIRECT_URL>" < data.sql
> ```
> Kalau DB lama isinya cuma hasil seed (cek: `face_embeddings`/`attendances` = 0 row), tidak ada yang
> perlu di-dump — langsung `prisma:seed` saja.

### Kasus: schema ada tanpa riwayat migration

Gejala: tabel app lengkap di DB, tapi `_prisma_migrations` **tidak ada** → `migrate deploy` gagal `P3005`.
Penyebab: schema dibuat lewat `prisma db push` atau SQL manual, yang **tidak** mencatat riwayat migration.

Menghapus row lewat Table Editor **tidak menyelesaikan ini** — yang kurang riwayat migration, bukan data.

Dua jalan keluar:

**A. Buang isinya, mulai bersih** (kalau data lama tidak dipakai)

```bash
npx prisma migrate status   # WAJIB — pastikan host-nya Supabase, bukan localhost
npx prisma migrate reset    # drop schema → apply 12 migration → bikin _prisma_migrations → auto-seed
```

`migrate reset` cuma menyentuh schema di connection string (`public`). Schema bawaan Supabase
(`auth`, `storage`, `extensions`) tidak ikut terhapus — jadi **isi bucket aman**.

**B. Pertahankan data** (baseline — akui schema yang ada tanpa drop)

```bash
for m in $(ls prisma/migrations | grep '^2'); do
  npx prisma migrate resolve --applied "$m"
done
npx prisma migrate status   # harus jadi "up to date"
```

Risiko B: schema hasil `db push` bisa **drift** dari isi folder migration. Kalau nanti ada
`migrate dev` yang gagal aneh, kemungkinan besar drift ini penyebabnya.

> Backup dulu sebelum A — REST API cukup, tidak perlu password Postgres:
> ```bash
> node -e "require('dotenv').config();const k=process.env.SUPABASE_SERVICE_ROLE_KEY;const t=['users','departments','attendances','face_embeddings','permissions','notifications','leave_balances','audit_logs'];(async()=>{const d={};for(const x of t){const r=await fetch(process.env.SUPABASE_URL+'/rest/v1/'+x+'?select=*',{headers:{apikey:k,Authorization:'Bearer '+k}});const j=await r.json();if(Array.isArray(j))d[x]=j}require('fs').writeFileSync('backup.json',JSON.stringify(d,null,2))})()"
> ```
> ⚠️ Hasilnya berisi **password hash & refresh token** — jangan commit, masukkan ke `.gitignore`.

---

## Akses dari HP (mobile app)

Skenario: laptop jalankan server, HP (Android/iOS) test mobile app.

### 1. HP di WiFi yang sama dengan laptop

```bash
# Windows — cari IP laptop
ipconfig
# Ambil "IPv4 Address" dari "Wireless LAN adapter Wi-Fi"
# Contoh: 192.168.1.10
```

Dari HP, base URL = `http://192.168.1.10:3000/attendance_api/...`

### 2. Firewall Windows

Pastikan Docker Desktop di-allow untuk network "Private". Cek:
`Windows Security → Firewall → Allow an app through firewall`.

### 3. Emulator Android

Pakai alias khusus `10.0.2.2` untuk reach host dari dalam emulator:
```
BASE_URL = http://10.0.2.2:3000/attendance_api
```

### 4. Android 9+ cleartext HTTP

Di `android/app/src/main/AndroidManifest.xml`:
```xml
<application android:usesCleartextTraffic="true" ...>
```

### 5. Demo di mana saja (pakai tunnel ngrok)

Tunnel ngrok expose server local ke internet, jadi HP nggak harus sewifi dengan laptop.

**a. Install ngrok** (sekali aja)

```powershell
winget install ngrok.ngrok      # atau: choco install ngrok
```

> ⚠️ Setelah install, **tutup & buka ulang terminal** supaya PATH ke-refresh.
> Kalau langsung ketik `ngrok` di terminal lama → muncul `'ngrok' is not recognized`.
> Verifikasi: `ngrok version`.

> ⚠️ **Versi winget sering jadul.** Akun ngrok minimal butuh agent `3.20.0+`
> (kalau kurang muncul `ERR_NGROK_121: agent version too old`). Update dengan:
> ```powershell
> ngrok update            # self-update bawaan, paling cepat
> # kalau gagal: download manual dari https://download.ngrok.com (Windows 64-bit)
> ```

**b. Daftar authtoken** (sekali aja — ngrok wajib login)

1. Daftar di https://dashboard.ngrok.com/signup
2. Copy token dari https://dashboard.ngrok.com/get-started/your-authtoken
3. ```powershell
   ngrok config add-authtoken <TOKEN_KAMU>
   ```

**c. Jalankan tunnel** (server harus sudah up di port 3000)

```powershell
ngrok http 3000
# Forwarding  https://abc123.ngrok-free.dev -> http://localhost:3000
```

Pakai URL `https://abc123.ngrok-free.dev` sebagai BASE_URL di mobile/web app:
`https://abc123.ngrok-free.dev/attendance_api/...`

> ⚠️ **Free plan menyisipkan halaman warning HTML** sebelum response. Tiap request
> dari frontend/Postman/curl **wajib** kirim header berikut (nilai bebas) supaya
> ngrok skip warning dan response tetap JSON:
> ```
> ngrok-skip-browser-warning: true
> ```
> Web app (axios) sudah menanganinya.

**d. URL ganti tiap restart?** Free plan kasih 1 static domain gratis.
Ambil di https://dashboard.ngrok.com/domains, lalu jalankan dengan domain tetap:

```powershell
ngrok http --url=nama-statis-kamu.ngrok-free.dev 3000
```

> Kalau diakses dari browser (frontend), tambahkan domain ngrok ke `CORS_ORIGIN` di `.env`
> lalu restart server. Lihat [CORS error](#cors-error-di-browser).
> **Inspect request:** buka `http://127.0.0.1:4040` (web interface ngrok) untuk
> melihat semua traffic yang masuk — sangat membantu debug call dari frontend.

---

## Testing API

### Health check
```bash
curl http://localhost:3000/
# {"status":"success","message":"API is running successfully.",...}
```

### Login admin
```bash
curl -X POST http://localhost:3000/attendance_api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"hr@example.com","password":"admin123"}'
```

Response: `{ data: { accessToken, refreshToken, user } }`.

### Call protected endpoint
```bash
TOKEN="<accessToken-dari-login>"
curl http://localhost:3000/attendance_api/users/profile \
  -H "Authorization: Bearer $TOKEN"
```

---

## Struktur Flow (Singkat)

Base URL: `/attendance_api`

### Admin journey
1. `POST /users/register-admin` — sekali seumur hidup (kalau belum ada admin)
2. `POST /users/login` — dapat access + refresh token
3. Setup master data: `POST /departments`, `POST /shifts` (set 1 shift `isActive=true` sebagai jadwal global)
4. Onboard karyawan: `POST /users` (employeeId auto-generate)
5. Monitoring: `GET /attendance/user-summary-attendances`, `GET /attendance/list-user-attendances`
6. Export Excel: `GET /attendance/list-user-attendances/export`

### Employee journey
1. `POST /users/login` — cek `isFaceRegistered` di response
2. Kalau `false`: `POST /faces/enroll` (upload 3–5 foto)
3. Dashboard: `GET /attendance/today` — dapat `state` untuk render UI
4. Check-in: `POST /faces/recognize` → `POST /attendance/check-in`
5. Check-out: `POST /faces/recognize` → `POST /attendance/check-out`

---

## Response Shape (konsisten lintas endpoint)

**Sukses:**
```json
{ "success": true, "message": "...", "data": { ... } }
```

**Error:**
```json
{ "success": false, "message": "...", "code": "NOT_FOUND" }
```

`code` (untuk branch di frontend):
- `VALIDATION_ERROR` — lihat `details` array
- `BAD_REQUEST` — business rule invalid
- `UNAUTHORIZED` — token invalid/expired → redirect login
- `NOT_FOUND`
- `CONFLICT` (atau typed: `ALREADY_CHECKED_IN`, `EMAIL_ALREADY_EXISTS`, …)

---

## Troubleshooting

### Container gak start / exit code 1
```bash
docker compose logs --tail=50 app
# Cari baris "Error:" atau "error:"
```

### Build error `npm ci`
Lock file mismatch. Sudah di-workaround pakai `npm install` di Dockerfile.

### Build error `@napi-rs/canvas` atau `bcrypt`
Network lambat saat download prebuilt binary. Solusi:
- Retry build: `docker compose build --no-cache app`
- Naikkan RAM Docker Desktop ke 4GB minimum

### Error `The datasource.url property is required`
`DATABASE_URL` nggak ter-inject. Artinya kamu run pakai `docker run` biasa, bukan compose. **Selalu pakai `docker compose up`.**

### Port 3000 sudah dipakai
```bash
# Ubah APP_PORT di .env ke misal 3002
APP_PORT=3002
docker compose up -d
```

### Face recognition selalu gagal
Cek model files lengkap:
```bash
docker compose exec app ls -la /app/public/models
# Harus 7 file (4 manifest + 3-4 shard)
```

### CORS error di browser
Tambahkan origin frontend ke `.env`:
```
CORS_ORIGIN=http://localhost:5174,http://192.168.1.10:5174
```
Restart: `docker compose restart app`.

### Upload foto wajah hilang setelah restart / `docker compose down`
Penyimpanan durable foto wajah **bukan di disk lokal, tapi di bucket Supabase** (`faces`) —
lihat [Arsitektur Data](#arsitektur-data-postgres--supabase-storage). Jadi restart server maupun
`docker compose down -v` tidak menghapusnya.

Yang ada di disk (`public/images/`, named volume `uploads` di compose) cuma **file transit** dari
multer `diskStorage` sebelum di-`uploadObject()` ke Supabase. Aman kalau hilang.

Kalau foto benar-benar hilang dari app, cek row-nya dulu — bukan disk:
```bash
psql "$DATABASE_URL" -c 'select count(*) from face_embeddings'
```
Row nol tapi bucket ada isinya = orphan (bekas reset DB), bukan file hilang.

---

## Struktur Folder

```
apps/api/
├── src/
│   ├── modules/           # Feature modules (users, attendances, faces, shifts, ...)
│   │   └── <module>/
│   │       ├── *.controller.js
│   │       ├── *.service.js
│   │       ├── *.repository.js
│   │       ├── *.routes.js
│   │       ├── *.model.js     # Joi validation schema
│   │       └── errors/        # Typed errors domain-specific
│   ├── middleware/        # auth, admin, upload, error, rateLimit, morgan
│   ├── utils/             # date, error, logger, geolocation, attendance-export
│   ├── config/            # env loader
│   ├── lib/               # prisma client, tokens helper
│   ├── routes/index.js    # Mount semua modules di /attendance_api
│   ├── app.js             # Express setup + middleware chain
│   └── server.js          # Boot: load face-api models → app.listen
├── prisma/
│   ├── schema.prisma      # Single source of truth schema DB
│   ├── migrations/        # Generated migration SQL
│   └── seed.js            # Seed department + admin default
├── public/
│   ├── models/            # Face-api weights (tiny_face, landmark, recognition)
│   └── images/            # (runtime) upload foto wajah & attendance
├── Dockerfile             # Stage dev: deps + nodemon
├── docker-compose.yml     # Postgres + app (hot-reload via bind-mount)
├── .env                   # Konfigurasi local (jangan commit)
├── .env.example           # Template env
```

---

## Konvensi Penting

Dua konvensi project yang WAJIB dipatuhi saat coding:

### 1. Timezone Asia/Jakarta
Semua manipulasi tanggal/jam **harus** lewat `src/utils/date.js`
(`inJakarta`, `toUtcDayStart`, `minutesOfDayJakarta`, dll).
**Jangan** pakai `Date.prototype.getHours()`, `getDate()`, atau `toISOString().split("T")[0]` langsung — bocor TZ server.

### 2. Error handling
**Jangan** `throw new Error(...)` generic di service. Pakai subclass `AppError`:
- Generik: `NotFoundError`, `ConflictError`, `BadRequestError`, `UnauthorizedError`, `ValidationError` dari `src/utils/error.js`
- Spesifik domain: `errors/<module>.error.js` (contoh: `AlreadyCheckedInError`)

Di controller pakai `sendError(res, error)` dan `validateOrThrow(schema, payload)` — jangan tulis response error manual.

