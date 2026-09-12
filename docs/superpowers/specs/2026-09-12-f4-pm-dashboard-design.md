# Feature F4: Dashboard PM (Workload, Stuck & Idle Alerts) Design Spec

Tanggal: 2026-09-12
Status: Disetujui
Root proyek: `D:\Project\Web Project\Enuma\StackGate`

## 1. Goal

Mengimplementasikan fitur inti MVP keempat: **F4 Dashboard PM (Log Riwayat, Durasi, dan Workload Analytics)**. Fitur ini memberikan visibilitas penuh dan objektif kepada Project Manager dan Lead Developer untuk memantau beban kerja anggota tim (siswa magang), mendeteksi tiket yang macet (*stuck* > 3 hari), mengidentifikasi anggota *idle* (0 tiket aktif), dan anggota *overload* (> 5 tiket aktif) tanpa perlu bertanya manual.

---

## 2. Aturan Bisnis & Definisi Metrik

1. **Konstanta Ambang Batas (Sesuai Spec MVP):**
   - `STUCK_AFTER_DAYS = 3` (tiket berada pada state yang sama lebih dari 3 hari terhitung dari transisi terakhir di `ticket_transitions` atau waktu pembuatan tiket).
   - `OVERLOAD_THRESHOLD = 5` (anggota memiliki lebih dari 5 tiket aktif dalam status `In Development` atau `Quality Gate Review`).
   - `IDLE`: Anggota memiliki **0 tiket aktif** dalam status `In Development` atau `Quality Gate Review`.

2. **Perhitungan Beban Kerja (Workload):**
   - Dihitung per anggota per state:
     - `Backlog`
     - `In Development`
     - `Quality Gate Review`
     - `Client Ready`
   - Status anggota dikategorikan:
     - `IDLE`: 0 tiket aktif (`in-development` + `review`).
     - `OVERLOAD`: > 5 tiket aktif (`in-development` + `review`).
     - `NORMAL`: 1 sampai 5 tiket aktif.

3. **Perhitungan Tiket Stuck:**
   - Menghitung durasi hari tiket bertahan di state saat ini dari `ticket_transitions` (atau `createdAt` jika belum pernah berpindah).
   - Tiket dengan status selain `ready` (Client Ready) yang durasinya `>= 3 hari` dimasukkan ke daftar peringatan *stuck*.

---

## 3. Spesifikasi Endpoint API (Backend Hono)

Endpoint ditambahkan ke `apps/api/src/plane/workspaces.ts`:

1. **`GET /api/workspaces/:slug/pm-dashboard`**
   - Autentikasi: Bearer JWT atau cookie `sg_refresh`.
   - Query params: `projectId` (opsional, jika kosong mengambil semua project dalam workspace).
   - Response:
     ```json
     {
       "summary": {
         "total_tickets": 15,
         "active_tickets": 12,
         "stuck_tickets_count": 3,
         "idle_members_count": 1,
         "overload_members_count": 0
       },
       "workload": [
         {
           "user": {
             "id": "uuid",
             "name": "Siswa",
             "email": "siswa@local.dev",
             "role": "student"
           },
           "backlog": 2,
           "in_development": 1,
           "review": 0,
           "ready": 3,
           "active_total": 1,
           "status": "NORMAL"
         }
       ],
       "stuck_tickets": [
         {
           "id": "uuid",
           "title": "Contoh tiket",
           "project_name": "Contoh Klien",
           "state_name": "Backlog",
           "assignee": { "id": "uuid", "name": "Siswa" } | null,
           "days_in_state": 4,
           "last_updated": "2026-09-08T..."
         }
       ]
     }
     ```

---

## 4. Spesifikasi Tampilan Frontend (UI)

1. **Lokasi:**
   - Menggantikan halaman `Overview` bawaan di `apps/web/core/components/analytics/overview/root.tsx` (dapat diakses via menu sidebar **Analytics** / URL `/:workspaceSlug/analytics/overview`).

2. **Komponen Visual `PMDashboardView`:**
   - **Kartu Ringkasan Cepat (4 Kartu Metrik):**
     1. Total Tiket Aktif (Netral).
     2. Tiket Stuck (>3 Hari) — Amber/Merah peringatan.
     3. Anggota Idle (0 Tiket) — Biru info.
     4. Anggota Overload (>5 Tiket) — Merah bahaya.
   - **Tabel Matriks Beban Kerja (Workload Matrix):**
     - Kolom: Anggota Tim (Avatar & Nama), Role, Backlog, In Dev, Review, Client Ready, Total Aktif, Status Badge (`NORMAL`, `IDLE`, `OVERLOAD`).
   - **Panel Peringatan Tiket Stuck:**
     - Menampilkan daftar tiket yang macet lengkap dengan judul, proyek, status, nama penanggung jawab, dan badge durasi (misal: `4 hari macet`).

---

## 5. Testing & Verifikasi

1. **Unit & Integration Test (`apps/api/tests/plane-workspaces.test.ts`):**
   - Uji `GET /api/workspaces/stackgate/pm-dashboard` tanpa autentikasi -> 401.
   - Uji `GET /api/workspaces/stackgate/pm-dashboard` terautentikasi -> 200 dengan struktur `summary`, `workload`, dan `stuck_tickets`.
   - Uji kalkulasi stuck jika tiket dibuat > 3 hari yang lalu.
   - Uji kalkulasi status `IDLE` dan `OVERLOAD`.
2. **Quality Gate:**
   - `pnpm --filter stackgate-api check:types` & `check:lint` pass.
   - `pnpm --filter stackgate-api test` -> 100% pass.
   - `pnpm --filter web check:types`, `check:lint`, dan `build` pass.
3. **Verifikasi E2E Browser:**
   - Buka `https://stackgate-web.vercel.app/stackgate/analytics/overview` di Playwright browser, verifikasi kartu metrik, matriks workload, dan peringatan stuck render dengan data nyata dari DB Neon.
