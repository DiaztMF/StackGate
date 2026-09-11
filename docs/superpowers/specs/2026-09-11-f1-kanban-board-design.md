# StackGate MVP - F1 Papan Kanban Tiket (Plane-Compat) Design Spec

Tanggal: 2026-09-11
Status: Disetujui
Root proyek: `D:\Project\Web Project\Enuma\StackGate`

## 1. Goal

Mengaktifkan fitur inti MVP StackGate: Papan Kanban Tiket (F1) pada UI fork Plane yang sudah berhasil diakses di `https://stackgate-web.vercel.app/stackgate/`. Tiket dapat ditampilkan per status (`Backlog`, `In Development`, `Quality Gate Review`, `Client Ready`), dibuat langsung dari UI, serta digeser antar-kolom dengan penegakan izin role (`student`, `lead`, `pm`) di backend.

---

## 2. Arsitektur & Endpoint (Hono API)

Semua endpoint ditambahkan ke file baru `apps/api/src/plane/issues.ts` dan di-mount pada `/api/workspaces` di `apps/api/src/app.ts`:

1. **`GET /api/workspaces/:slug/projects/:projectId/issues/`**
   - Autentikasi: via Bearer JWT atau cookie session `sg_refresh`.
   - Mengambil semua tiket milik project dari tabel `tickets` di Neon Postgres.
   - Mengembalikan response `TIssuesResponse`:
     ```json
     {
       "results": [ /* TBaseIssue[] */ ],
       "total_results": 1,
       "total_count": 1,
       "count": 1,
       "grouped_by": null,
       "next_cursor": "",
       "prev_cursor": "",
       "next_page_results": false,
       "prev_page_results": false,
       "total_pages": 1,
       "extra_stats": null
     }
     ```

2. **`POST /api/workspaces/:slug/projects/:projectId/issues/`**
   - Membuat tiket baru dalam status default `Backlog`.
   - Menetapkan `reporterId` sebagai user yang sedang login.
   - Mengembalikan data `TIssue` hasil insert.

3. **`PATCH /api/workspaces/:slug/projects/:projectId/issues/:issueId/`**
   - Menangani update tiket dan drag-and-drop antar status.
   - Jika payload menyertakan `state_id`:
     - Membaca state tujuan dan state asal.
     - Mengevaluasi `checkTransition()` dari `apps/api/src/tickets/guard.ts`.
     - Jika tidak memenuhi aturan (misal: role student mencoba memindahkan ke `ready`, atau checklist gate belum lengkap): return HTTP 403 / 422 dengan pesan error user-friendly.
     - Jika lolos: update `stateId` di tabel `tickets` dan catat riwayat di `ticket_transitions`.
   - Mengembalikan data `TIssue` yang telah diperbarui.

4. **`GET /api/workspaces/:slug/projects/:projectId/issue-display-properties/`**
   - Mengembalikan konfigurasi properti kartu di Kanban (assignee, priority, state) dengan status 200 agar UI tidak melempar error.

---

## 3. Data Mapping

| Kolom DB `tickets` | Field Plane FE `TIssue` | Catatan |
|---|---|---|
| `id` | `id` | UUID string |
| `title` | `name` | Judul tiket |
| `description` | `description_html` | Deskripsi teks/HTML |
| `stateId` | `state_id` | Foreign key ke tabel `states` |
| `assigneeId` | `assignee_ids` | `assigneeId ? [assigneeId] : []` |
| `reporterId` | `created_by` | UUID user pembuat |
| `createdAt` | `created_at` | ISO 8601 string |
| `sort_order` | `sort_order` | Nilai `65535` default |
| - | `sub_issues_count` | `0` |
| - | `attachment_count` | `0` |
| - | `link_count` | `0` |

---

## 4. Testing & Verifikasi

1. **Unit & Integration Test:**
   - File baru `apps/api/tests/plane-issues.test.ts`.
   - Uji tanpa autentikasi -> 401.
   - Uji ambil tiket terautentikasi -> 200 dengan struktur `TIssuesResponse`.
   - Uji pembuatan tiket baru -> 201 dengan `stateId = backlog`.
   - Uji guard transisi via PATCH: student ditolak saat drag ke `ready` (403), diizinkan ke `in-development` (200).
2. **Standard Quality Gate:**
   - `pnpm --filter stackgate-api check:types` -> exit 0.
   - `pnpm --filter stackgate-api check:lint` -> 0 errors, 0 warnings.
   - `pnpm --filter stackgate-api test` -> semua test suite pass.
3. **End-to-End Browser Check:**
   - Buka project board di `https://stackgate-web.vercel.app/stackgate/projects/` dan verifikasi kolom board menampilkan tiket seed dev.
