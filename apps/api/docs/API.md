# API Reference — Attendance Management System

Dokumentasi endpoint untuk tim Frontend. Dibuat dari kode (route + Joi schema), jadi
mencerminkan kontrak yang benar-benar berjalan di server.

- **Base URL:** `{APP_URL}/attendance_api`
- **Health check:** `GET /` → `{ status, message, environment }`
- **Format tanggal:** ISO-8601. Logika hari/jam memakai timezone **Asia/Jakarta** di server
  (lihat `SETUP.md`). Kolom tanggal disimpan sebagai UTC-midnight tanggal Jakarta.

---

## Konvensi Umum

### Autentikasi
JWT via header:
```
Authorization: Bearer <accessToken>
```
- **PUBLIC** — tanpa token.
- **USER** — perlu token (karyawan & admin).
- **ADMIN** — perlu token + role `ADMIN`.

`accessToken` berumur pendek; perbarui via `POST /users/refresh-token` memakai `refreshToken`.

### Bentuk Response Sukses
```json
{
  "success": true,
  "message": "deskripsi singkat",
  "data": { },
  "pagination": { "total": 0, "page": 1, "limit": 10, "totalPage": 1 }
}
```
`data` bisa objek atau array. `pagination` hanya muncul di endpoint list.

> Catatan: key pagination tidak 100% seragam antar module — sebagian pakai `totalPage`,
> sebagian `totalPages`. Lihat tiap endpoint.

### Bentuk Response Error
```json
{
  "success": false,
  "message": "pesan error",
  "code": "ERROR_CODE",
  "detail": ["field - pesan validasi"]
}
```
`code` ada di semua error yang ter-tipe. `detail` (array string) hanya ada di error
validasi (`VALIDATION_ERROR`). Beberapa error membawa `details` (objek), misalnya
`INSUFFICIENT_LEAVE_BALANCE`. Error tak terduga selalu dibalas 500 dengan pesan
generik `"Internal Server Error"` tanpa detail internal. Status code yang dipakai:

| Status | Arti |
|-------:|------|
| 400 | Bad request / validasi gagal (`VALIDATION_ERROR`, `BAD_REQUEST`) |
| 401 | Token salah/expired, login gagal (`UNAUTHORIZED`) |
| 403 | Bukan admin / akun nonaktif / verifikasi wajah tidak sah (`FACE_VERIFICATION_REQUIRED`) / origin CORS ditolak (`CORS_FORBIDDEN`) |
| 404 | Resource tidak ditemukan (`NOT_FOUND`) |
| 409 | Konflik state/race (`CONFLICT`, `INSUFFICIENT_LEAVE_BALANCE`, dll) |
| 500 | Error tak terduga |

### Upload File
`multipart/form-data`, maksimal **5 MB/file**. Mime diizinkan per field:

| Field | Mime |
|-------|------|
| `user_faces`, `attendance_photo`, `profile_photo` | `image/jpeg`, `image/png` |
| `permission_attachment` | `image/jpeg`, `image/png`, `application/pdf`, `application/msword`, `…wordprocessingml.document` (docx) |

File melebihi batas atau mime tidak sesuai → **400**.

### Field URL Asset
Field yang menyimpan path file mengekspos sibling `<field>_url` berisi URL siap-pakai
(mis. `imageUrl` → `imageUrl_url`, `attachmentUrl` → `attachmentUrl_url`). FE cukup pakai `*_url`.

---

## Realtime (SSE)

```
GET /attendance_api/events/stream
```
- Auth: **USER** lewat header `Authorization: Bearer <accessToken>`. `?token=<accessToken>` masih diterima untuk `EventSource` native yang tidak bisa kirim header.
- `Content-Type: text/event-stream`, auto-reconnect 5 dtk.
- Admin menerima channel admin; karyawan menerima event miliknya.

Event yang dikirim:

| Event | Penerima | Saat |
|-------|----------|------|
| `connected` | semua | koneksi terbuka |
| `permission:submitted` | admin | karyawan ajukan izin |
| `permission:decided` | pemilik izin | izin di-approve/reject |
| `permission:cancelled` | admin | karyawan batalkan izin |
| `attendance:checked_in` | admin | karyawan check-in |
| `attendance:checked_out` | admin | karyawan check-out |


---

## 1. Users & Auth

| Method | Path | Role | Keterangan |
|--------|------|------|-----------|
| POST | `/users/register-admin` | PUBLIC | Setup admin pertama (hanya boleh 1×) |
| POST | `/users/login` | PUBLIC | Login |
| POST | `/users/refresh-token` | PUBLIC | Perbarui access token |
| POST | `/users/logout` | USER | Logout (1 device / semua device) |
| GET | `/users/profile` | USER | Profil sendiri |
| PATCH | `/users/profile` | USER | Update nama/telepon |
| PATCH | `/users/profile/photo` | USER | Ganti foto profil (file) |
| PATCH | `/users/password` | USER | Ganti password |
| POST | `/users/password/forgot` | PUBLIC | Minta token reset |
| POST | `/users/password/reset` | PUBLIC | Reset password via token |
| POST | `/users` | ADMIN | Buat karyawan |
| GET | `/users` | ADMIN | List karyawan (paginated) |
| GET | `/users/:id` | ADMIN | Detail karyawan |
| PATCH | `/users/:id` | ADMIN | Update data karyawan (partial) |
| PATCH | `/users/:id/toggle-active` | ADMIN | Aktif/nonaktifkan akun |
| PATCH | `/users/:id/reset-password` | ADMIN | Buat link reset password karyawan |

**POST `/users/login`**
```json
{ "email": "user@mail.com", "password": "secret" }
```
Response `data`: `{ user: {...}, accessToken, refreshToken }`. Login gagal → 401 dengan
pesan generik (tidak membedakan email salah / password salah).

**POST `/users/refresh-token`** — `{ "refreshToken": "..." }` → `data: { accessToken, isFaceRegistered }`.

**POST `/users/logout`** — body opsional `{ "refreshToken": "..." }`. Tanpa refreshToken =
logout dari semua device.

**POST `/users/register-admin`**
```json
{ "email": "...", "password": "min6", "fullName": "min3", "phone": "8-20 digit" }
```

**POST `/users`** (admin buat karyawan)
```json
{
  "email": "...", "password": "min6", "fullName": "min3", "phone": "...",
  "departmentCode": "IT", "position": "STAFF",
  "role": "EMPLOYEE",            // optional, default EMPLOYEE
  "joinDate": "2026-01-01"        // optional ISO, default hari ini
}
```
`position` ∈ `DIRECTOR, MANAGER, SUPERVISOR, TEAM_LEAD, SENIOR_STAFF, STAFF, JUNIOR_STAFF,
HR_SPECIALIST, FINANCE_SPECIALIST, IT_SPECIALIST, MARKETING_SPECIALIST, INTERN, CONTRACT, OTHER`.
`employeeId` di-generate otomatis (`EMP-001`, …).

**PATCH `/users/profile`** — `{ fullName?, phone? }`.
**PATCH `/users/password`** — `{ oldPassword, newPassword (min6) }`.
**PATCH `/users/profile/photo`** — form field `profile_photo` (image saja).
**POST `/users/password/forgot`** — `{ email }`. Selalu balas sukses generik (anti-enumerasi).
**POST `/users/password/reset`** — `{ token (64 hex), newPassword (min6) }`.
**GET `/users`** — query: `page, limit (maks 100), search, departmentId (uuid), role (ADMIN|EMPLOYEE), isActive (bool)`. Query tidak valid → 400.
**PATCH `/users/:id/toggle-active`** dan **PATCH `/users/:id`** menolak (400) kalau admin mencoba menonaktifkan atau menurunkan role akunnya sendiri.
Ganti password (endpoint `/users/password` maupun lewat admin) mencabut semua refresh token user tersebut.
**PATCH `/users/:id`** (admin update karyawan) — partial, **minimal 1 field**:
```json
{
  "email": "...", "fullName": "min3", "phone": "8-20 digit",
  "departmentCode": "IT", "position": "STAFF",
  "role": "EMPLOYEE",            // ADMIN | EMPLOYEE
  "isActive": true,
  "password": "min6"             // langsung set ulang password
}
```
`position` enum sama seperti `POST /users`. Email dipakai user lain → **409** (`EMAIL_ALREADY_EXISTS`).
`departmentCode` tidak ditemukan → **404** (`DEPARTMENT_NOT_FOUND`). User tidak ada → **404**.
**PATCH `/users/:id/reset-password`** — tanpa body. Membuat token reset untuk karyawan target
(admin serahkan ke karyawan untuk atur password sendiri). `data: { employeeId, email, token, expiresAt }`.
User tidak ada → **404**.

---

## 2. Faces (Verifikasi Wajah)

| Method | Path | Role | Keterangan |
|--------|------|------|-----------|
| POST | `/faces/enroll` | USER | Daftarkan wajah (3–10 foto) |
| POST | `/faces/recognize` | USER | Verifikasi wajah (1 foto) |
| GET | `/faces/my-embeddings` | USER | List foto wajah terdaftar |
| DELETE | `/faces/reset` | USER | Hapus semua data wajah |

**POST `/faces/enroll`** — form field `user_faces` (array, **3–10** file image).
Response `data`: `{ enrolled, failed, total, results[], errors[] }`. Foto duplikat/gagal
deteksi masuk `errors`.

**POST `/faces/recognize`** — form field `attendance_photo` (1 file image).
Berhasil → `data: { userId, distance, confidence, verificationToken? }`. Tidak dikenali → **404**.
`verificationToken` hanya ada kalau wajah cocok dengan user yang login; berlaku 5 menit.
> Alur FE: panggil `recognize` dulu, lalu kirim `verificationToken` sebagai `faceToken` ke `check-in` / `check-out`.

---

## 3. Attendances (Absensi)

| Method | Path | Role | Keterangan |
|--------|------|------|-----------|
| GET | `/attendance/today` | USER | State absensi hari ini |
| GET | `/attendance/my/history` | USER | Riwayat absensi sendiri |
| GET | `/attendance/locations` | USER | List lokasi kantor aktif |
| POST | `/attendance/check-in` | USER | Check-in |
| POST | `/attendance/check-out` | USER | Check-out |
| GET | `/attendance/user-summary-attendances` | ADMIN | Ringkasan per tanggal |
| GET | `/attendance/list-user-attendances` | ADMIN | List absensi semua user |
| GET | `/attendance/list-user-attendances/export` | ADMIN | Export Excel |
| GET | `/attendance/user-attendance/:id` | ADMIN | Detail absensi |
| POST | `/attendance/create-manual` | ADMIN | Input absensi manual |

**GET `/attendance/today`** → `data: { state, today, attendance, shift, activePermission }`.
`state` ∈ `WORKING, DONE, PENDING_CHECKOUT_PREV_DAY, ON_LEAVE, WFH_PENDING_CHECKIN, NOT_CHECKED_IN`.
`unresolvedSession` (`{ id, date, checkIn, workMode, expired }` | `null`) — sesi hari sebelumnya yang masih terbuka dan sudah lewat batas check-out (`MAX_OPEN_SESSION_HOURS`, default 18 jam). Tidak memblokir check-in hari ini; FE tampilkan peringatan, koreksi lewat admin.
> `workingDuration` **tidak** dihitung backend — FE hitung sendiri dari `now - checkIn` untuk timer live.

**POST `/attendance/check-in`**
```json
{
  "workMode": "WFO",            // WFO | WFA
  "latitude": -6.22, "longitude": 106.88,
  "gpsAccuracy": 15,            // optional, meter
  "deviceInfo": "Pixel 7",      // optional
  "note": "...",                // optional
  "faceToken": "<verificationToken>"
}
```
- `faceToken` tidak ada, kedaluwarsa, atau milik user lain → 403 `FACE_VERIFICATION_REQUIRED`.
- `WFO` → divalidasi terhadap radius lokasi kantor; di luar radius → 400 (pesan menyertakan jarak terdekat).
- Sudah check-in → 409. Sedang cuti yang di-approve → 409.
- WFH approved → otomatis dipaksa `WFA` (skip cek lokasi).

**POST `/attendance/check-out`** — `{ latitude, longitude, gpsAccuracy?, faceToken }`.
Belum check-in → 404. Sudah check-out → 409. Mendukung checkout lewat tengah malam.
Sesi terbuka lebih tua dari `MAX_OPEN_SESSION_HOURS` → 409 `CHECKOUT_WINDOW_EXPIRED` (butuh koreksi admin).

**GET `/attendance/my/history`** — query: `dateFrom, dateTo, status, workMode, page, limit` (`totalPages`).
**GET `/attendance/list-user-attendances`** — query: `date | (dateFrom,dateTo), userId, departmentId, status, workMode, shiftName, page, limit`.
**GET `/attendance/.../export`** — query sama (tanpa page/limit), respons **file .xlsx** (`Content-Disposition`). **Wajib** `date`, atau `dateFrom` bersama `dateTo`; tanpa itu → 400. Rentang max 92 hari.
**GET `/attendance/user-summary-attendances`** — query `date?` → hitungan per status & workMode.
**POST `/attendance/create-manual`**
```json
{
  "userId": "uuid", "date": "ISO", "checkIn": "ISO", "checkOut": "ISO?",
  "status": "PRESENT", "workMode": "WFO", "shiftName": "MORNING?",
  "latitudeIn?": 0, "longitudeIn?": 0, "latitudeOut?": 0, "longitudeOut?": 0, "note?": ""
}
```
`status` ∈ `PRESENT, LATE, ABSENT, SICK, PERMIT, ON_LEAVE, HOLIDAY, WORK_FROM_HOME`.

---

## 4. Permissions (Izin/Cuti)

| Method | Path | Role | Keterangan |
|--------|------|------|-----------|
| POST | `/permissions/request` | USER | Ajukan izin (+lampiran) |
| GET | `/permissions/my-permission` | USER | Izin sendiri |
| PATCH | `/permissions/:id/cancel` | USER | Batalkan izin sendiri (pending) |
| GET | `/permissions` | ADMIN | List semua izin |
| GET | `/permissions/:id` | ADMIN | Detail izin |
| PATCH | `/permissions/:id/approve` | ADMIN | Setujui |
| PATCH | `/permissions/:id/reject` | ADMIN | Tolak |

**POST `/permissions/request`** — `multipart/form-data`, field teks + opsional file `permission_attachment`:
```
type        : SICK|PERMIT|ANNUAL_LEAVE|MATERNITY_LEAVE|PATERNITY_LEAVE|
              MARRIAGE_LEAVE|BEREAVEMENT|HALF_DAY|WORK_FROM_HOME|OTHER
startDate   : ISO (required)
endDate     : ISO (required, >= startDate)
reason      : string max 500 (optional)
```
Tipe yang memotong saldo cuti: `ANNUAL_LEAVE, MATERNITY_LEAVE, PATERNITY_LEAVE,
MARRIAGE_LEAVE, BEREAVEMENT` → saldo kurang saat submit → 409. Durasi dihitung **inklusif**.

**PATCH `/permissions/:id/approve`** — `{ note? }`. Saldo kurang saat approve → 409
(`INSUFFICIENT_LEAVE_BALANCE`). Sudah diproses admin lain → 409.
**PATCH `/permissions/:id/reject`** — `{ note }` (**wajib**).
**PATCH `/permissions/:id/cancel`** — hanya izin sendiri & status `PENDING`.
**GET `/permissions`** — query: `page, limit (maks 100), search, type, status` (`totalPage`). `type`/`status` di luar enum → 400.

---

## 5. Leave Balances (Saldo Cuti)

| Method | Path | Role | Keterangan |
|--------|------|------|-----------|
| GET | `/leave-balances/my-balance` | USER | Saldo sendiri |
| GET | `/leave-balances` | ADMIN | List saldo |
| POST | `/leave-balances` | ADMIN | Set saldo manual |
| GET | `/leave-balances/by-user/:userId` | ADMIN | Saldo per user (semua tahun) |
| PATCH | `/leave-balances/:id` | ADMIN | Update saldo |

**GET `/leave-balances/my-balance`** — query `year?` (default tahun berjalan Jakarta).
`data`: `{ year, annualQuota, usedDays, remainingDays, carryOverDays, ... }`. Auto-init kalau belum ada.
**POST `/leave-balances`** — `{ userId, year, annualQuota, carryOverDays }`.
**PATCH `/leave-balances/:id`** — `{ annualQuota?, carryOverDays? }` (`remainingDays` dihitung server).
**GET `/leave-balances`** — query: `page, limit, search, userId, year` (`totalPage`).

---

## 6. Notifications

| Method | Path | Role | Keterangan |
|--------|------|------|-----------|
| GET | `/notifications` | USER | List notifikasi |
| GET | `/notifications/unread-count` | USER | Jumlah belum dibaca |
| PATCH | `/notifications/:id/read` | USER | Tandai 1 dibaca |
| PATCH | `/notifications/read-all` | USER | Tandai semua dibaca |
| GET | `/events/stream` | USER | SSE realtime (lihat bagian Realtime) |

**GET `/notifications`** — query: `page, limit, unreadOnly (bool), type` (`totalPage`).
`type` ∈ `ATTENDANCE_REMINDER, ATTENDANCE_CHECK_IN, ATTENDANCE_CHECK_OUT,
PERMISSION_SUBMITTED, PERMISSION_APPROVED, PERMISSION_REJECTED, ANNOUNCEMENT, SYSTEM`.
> Notifikasi dibuat otomatis oleh sistem — tidak ada endpoint "create".

---

## 7. Shifts (Jadwal Kerja)

| Method | Path | Role | Keterangan |
|--------|------|------|-----------|
| GET | `/shifts/active` | USER | Shift aktif (untuk jadwal mobile) |
| GET | `/shifts` | ADMIN | List shift |
| GET | `/shifts/:id` | ADMIN | Detail shift |
| POST | `/shifts` | ADMIN | Buat shift |
| PUT | `/shifts/:id` | ADMIN | Update shift |
| DELETE | `/shifts/:id` | ADMIN | Hapus shift |

**POST `/shifts`**
```json
{
  "name": "MORNING",            // MORNING|AFTERNOON|NIGHT|FULL_DAY|SPLIT_SHIFT|FLEXIBLE
  "startTime": "ISO", "endTime": "ISO",
  "gracePeriod": 0,             // menit toleransi telat, default 0
  "isActive": false,            // hanya 1 shift boleh aktif (di-handle server)
  "description": "..."          // optional
}
```
**PUT `/shifts/:id`** — partial (minimal 1 field). Set `isActive: true` otomatis mematikan shift lain.

---

## 8. Locations (Lokasi Kantor / Geofence)

| Method | Path | Role | Keterangan |
|--------|------|------|-----------|
| GET | `/locations` | ADMIN | List lokasi |
| GET | `/locations/:id` | ADMIN | Detail lokasi |
| POST | `/locations` | ADMIN | Buat lokasi |
| PUT | `/locations/:id` | ADMIN | Update lokasi |
| DELETE | `/locations/:id` | ADMIN | Soft-delete lokasi |

**POST `/locations`**
```json
{
  "name": "Kantor Pusat",       // 3-100 char
  "address": "...",             // optional
  "latitude": -6.2,             // -90..90
  "longitude": 106.8,           // -180..180
  "radius": 150,                // 1..10000 meter
  "isActive": true
}
```
> Lokasi aktif juga bisa dibaca karyawan lewat `GET /attendance/locations`.

---

## 9. Departments

| Method | Path | Role | Keterangan |
|--------|------|------|-----------|
| GET | `/departments` | ADMIN | List departemen |
| GET | `/departments/code/:code` | ADMIN | Cari by kode |
| GET | `/departments/:id` | ADMIN | Detail |
| POST | `/departments` | ADMIN | Buat |
| PUT | `/departments/:id` | ADMIN | Update |
| DELETE | `/departments/:id` | ADMIN | Hapus |

**POST `/departments`** — `{ name (min3), code (min2, UPPERCASE), headId? (uuid) }`. `headId` sudah jadi kepala department lain → 409; `headId` tidak dikenal → 404.
**GET `/departments`** — query: `page, limit, search, code, name`.

---

## 10. Reports (Laporan — ADMIN)

| Method | Path | Query |
|--------|------|-------|
| GET | `/reports/attendance/monthly` | `month (1-12), year, departmentId?, userId?` |
| GET | `/reports/attendance/weekly` | `weekStart (YYYY-MM-DD), departmentId?, userId?` |
| GET | `/reports/attendance/range` | `from, to (>=from), departmentId?, userId?` |

Response `data`: `{ period, summary, details[] }`. `details[]` = rekap per karyawan
(present/late/absent/permit/leave/wfh + totalWorkHours). Range max 366 hari.
Hari kerja dihitung Sen–Jum (belum termasuk libur nasional).

---

## 11. Audit Logs (ADMIN)

| Method | Path | Query |
|--------|------|-------|
| GET | `/audit-logs` | `page, limit, userId?, action?, dateFrom?, dateTo?` |

Mencatat aksi sensitif admin (create user, toggle active, approve/reject/cancel izin, dll).

---

## Catatan Kompatibilitas FE
- **Foto/dokumen** disajikan via Supabase Storage. Selalu pakai field `*_url`, jangan susun URL sendiri.
- **Pagination** mayoritas `totalPage`; `attendances` pakai `totalPages` (lihat masing-masing).
- **Tidak ada hard-delete user** — pakai `PATCH /users/:id/toggle-active`.
- **Timezone**: semua perhitungan hari/jam berbasis Asia/Jakarta. Kirim tanggal sebagai ISO.
