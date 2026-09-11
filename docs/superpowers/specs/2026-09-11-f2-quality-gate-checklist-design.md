# Feature F2: Quality Gate Checklist (Gerbang Validasi) Design Spec

Tanggal: 2026-09-11
Status: Disetujui
Root proyek: `D:\Project\Web Project\Enuma\StackGate`

## 1. Goal

Mengimplementasikan fitur inti MVP kedua: **F2 Gerbang Validasi (Quality Gate Checklist)**. Fitur ini memastikan setiap tiket yang dikerjakan siswa magang memiliki checklist mutu yang jelas dan hanya dapat diverifikasi oleh Lead Developer sebelum tiket diizinkan berpindah ke status `Client Ready`.

---

## 2. Aturan Bisnis & Kontrak Izin (Strict Gate Rule)

1. **4 Item Kriteria Mutu Default:**
   Saat tiket baru dibuat via UI atau API, backend secara otomatis membuat 4 item mutu awal di tabel `gate_check_items`:
   - `Kode berjalan sesuai acceptance tiket`
   - `Tidak ada secret / API key ter-commit`
   - `Mengikuti modul riset yang ditautkan`
   - `Sudah self-test oleh pelaksana`

2. **Hak Akses Validasi:**
   - **`lead`**: Memiliki hak penuh untuk mencentang/membatalkan checklist (`checked_by_id`, `checked_at`) dan menambahkan kriteria kustom baru.
   - **`student`**: Hanya memiliki izin membaca (read-only). Siswa tidak dapat mencentang checklist sendiri. Permintaan centang dari student ditolak dengan HTTP 403 `FORBIDDEN_TRANSITION`.
   - **`pm`**: Memiliki izin membaca dan menambah kriteria kustom.

3. **Enforcement Transisi:**
   - Perpindahan tiket ke state `Client Ready` (`ready`) ditolak dengan HTTP 422 `GATE_INCOMPLETE` bila masih ada item checklist yang belum dicentang (`checked_at IS NULL`).

---

## 3. Spesifikasi Endpoint API (Backend Hono)

Endpoint ditambahkan ke `apps/api/src/plane/issues.ts`:

1. **`GET /api/workspaces/:slug/projects/:projectId/issues/:issueId/gate-checks`**
   - Autentikasi: Bearer JWT atau cookie `sg_refresh`.
   - Mengambil daftar checklist dari `gate_check_items` dan men-join `users` untuk data verifikator.
   - Response:
     ```json
     {
       "items": [
         {
           "id": "uuid",
           "ticket_id": "uuid",
           "label": "string",
           "checked": boolean,
           "checked_by": { "id": "uuid", "name": "string", "email": "string" } | null,
           "checked_at": "ISO string" | null
         }
       ]
     }
     ```

2. **`POST /api/workspaces/:slug/projects/:projectId/issues/:issueId/gate-checks`**
   - Menambahkan kriteria kustom baru.
   - Guard: Ditolak bila role pemanggil adalah `student` (HTTP 403 `FORBIDDEN_TRANSITION`).
   - Body: `{ "label": "string" }`.
   - Response: Item baru (HTTP 201).

3. **`PATCH /api/workspaces/:slug/projects/:projectId/issues/:issueId/gate-checks/:checkId`**
   - Mengubah status centang checklist.
   - Guard: **Hanya role `lead`** yang diizinkan (HTTP 403 untuk selain lead).
   - Body: `{ "checked": boolean }`.
   - Action: Update `checked_by_id` dan `checked_at` di DB.
   - Response: Item yang diperbarui (HTTP 200).

---

## 4. Spesifikasi Komponen Frontend (UI)

1. **Komponen Baru `QualityGateWidget`:**
   - Diletakkan di `apps/web/core/components/issues/issue-detail/main-content.tsx` (di bawah kolom deskripsi pekerjaan).
2. **Desain Komponen:**
   - Header: Ikon perisai (CheckOutline/Shield), judul `Quality Gate Checklist`, serta badge progress (misal: `2/4 Terverifikasi` dan progress bar dinamis).
   - Card List: Daftar kriteria mutu dengan checkbox.
   - Timestamp Audit: Menampilkan keterangan *"Diverifikasi oleh [Nama Lead] • [Waktu]"* bila sudah dicentang.
   - Pembatasan Role:
     - Checkbox `disabled` untuk role `student` dengan teks bantuan: *"Hanya Lead developer yang dapat memvalidasi kriteria mutu ini."*
     - Checkbox interaktif untuk role `lead` + form inline sederhana `+ Tambah Kriteria`.

---

## 5. Testing & Verifikasi

1. **Unit & Integration Test (`apps/api/tests/plane-issues.test.ts`):**
   - Tiket baru otomatis memiliki 4 item checklist mutu.
   - `GET gate-checks` mengembalikan 4 item.
   - `PATCH gate-checks` ditolak 403 bila aktor adalah `student`.
   - `PATCH gate-checks` berhasil 200 bila aktor adalah `lead`.
   - Transisi tiket ke `Client Ready` berhasil setelah semua kriteria tercentang oleh lead.
2. **Standard Quality Gate:**
   - `pnpm --filter stackgate-api check:types` -> exit 0.
   - `pnpm --filter stackgate-api check:lint` -> 0 errors.
   - `pnpm --filter stackgate-api test` -> all tests pass.
   - `pnpm --filter web check:types` -> exit 0.
   - `pnpm --filter web check:lint` -> exit 0.
   - `pnpm --filter web build` -> exit 0.
3. **Verifikasi E2E Browser:**
   - Login sebagai Siswa: checklist terlihat di detail tiket dengan status read-only.
   - Login sebagai Lead: checklist dapat dicentang dan tiket berhasil ditutup ke Client Ready.
