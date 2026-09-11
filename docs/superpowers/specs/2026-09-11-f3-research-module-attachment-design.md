# Feature F3: Tautan Modul Riset (Research Asset Attachment) Design Spec

Tanggal: 2026-09-11
Status: Disetujui
Root proyek: `D:\Project\Web Project\Enuma\StackGate`

## 1. Goal

Mengimplementasikan fitur inti MVP ketiga: **F3 Tautan Modul Riset (Research Asset Attachment)**. Fitur ini menjembatani divisi riset dan divisi produksi (siswa magang). Tiket yang memiliki flag `research_required` mewajibkan adanya tautan modul riset teknis sebelum siswa magang diizinkan memindahkan tiket ke tahap `Quality Gate Review` atau ditutup ke `Client Ready`.

---

## 2. Aturan Bisnis & Guard Penegakan (Strict Research Link Rule)

1. **Flag `research_required`:**
   - Ditentukan saat pembuatan tiket atau di-toggle kemudian oleh role `lead` atau `pm`.
   - Role `student` tidak dapat mengubah flag `research_required` (read-only).
2. **Penegakan Transisi State (`checkTransition` di `apps/api/src/tickets/guard.ts`):**
   - **`In Development` → `Quality Gate Review`:** Jika `ticket.researchRequired === true`, dan belum ada baris di tabel `research_links` untuk tiket ini, transisi DITOLAK dengan HTTP 422 `RESEARCH_LINK_REQUIRED: Tautan modul riset wajib diisi dulu`.
   - **`Quality Gate Review` → `Client Ready`:** Jika `ticket.researchRequired === true` dan tautan riset kosong, penutupan tiket DITOLAK dengan HTTP 422 `RESEARCH_LINK_REQUIRED`.
3. **Penautan Riset:**
   - Baik `student`, `lead`, maupun `pm` dapat menautkan URL modul riset yang dijadikan acuan teknis.

---

## 3. Spesifikasi Endpoint API (Backend Hono)

Endpoint ditambahkan ke `apps/api/src/plane/issues.ts`:

1. **`GET /api/workspaces/:slug/projects/:projectId/issues/:issueId/research-links`**
   - Autentikasi: Bearer JWT atau cookie `sg_refresh`.
   - Response:
     ```json
     {
       "research_required": boolean,
       "links": [
         {
           "id": "uuid",
           "ticket_id": "uuid",
           "url": "https://...",
           "label": "string",
           "required": boolean,
           "created_by": { "id": "uuid", "name": "string", "email": "string" } | null
         }
       ]
     }
     ```

2. **`POST /api/workspaces/:slug/projects/:projectId/issues/:issueId/research-links`**
   - Body: `{ "url": "string", "label": "string", "required"?: boolean }`
   - Validasi URL dan label tidak boleh kosong.
   - Insert ke tabel `research_links` dengan `createdById = user.id`.
   - Response: Item tautan baru (HTTP 201).

3. **`DELETE /api/workspaces/:slug/projects/:projectId/issues/:issueId/research-links/:linkId`**
   - Hapus tautan riset. Izin: pembuat tautan, `lead`, atau `pm`.
   - Response: `{ "ok": true }` (HTTP 200).

4. **`PATCH /api/workspaces/:slug/projects/:projectId/issues/:issueId`**
   - Mendukung pembaruan payload `{ "research_required": boolean }`.
   - Validasi: Hanya `lead` dan `pm` yang boleh mengubah flag `research_required`.

---

## 4. Spesifikasi Komponen Frontend (UI)

1. **Komponen Baru `ResearchModuleWidget`:**
   - File: `apps/web/core/components/issues/issue-detail/research-module-widget.tsx`.
   - Terintegrasi di:
     - `apps/web/core/components/issues/issue-detail/main-content.tsx`
     - `apps/web/core/components/issues/peek-overview/issue-detail.tsx`
     (ditempatkan tepat di bawah `QualityGateWidget`).
2. **Elemen Visual & Interaksi:**
   - **Header:**
     - Ikon Buku / Modul Riset + Judul `Modul Riset Terkait`.
     - Toggle / Badge `Riset Diperlukan` (aktif jika `research_required` bernilai true).
     - Jika `research_required` aktif dan link masih 0, tampilkan alert amber/kuning: *"Tiket ini wajib menautkan modul riset sebelum dapat diajukan ke review."*
   - **List Tautan:**
     - Menampilkan daftar link riset: Judul label, URL eksternal (terbuka di tab baru dengan icon link), dan nama penaut.
     - Tombol ikon hapus (tempat sampah) untuk menghapus link.
   - **Form Tambah Tautan:**
     - Input field `Label Modul` (placeholder: misal *Modul Arsitektur Auth JWT*) + `URL Dokumen/Repositori` (placeholder: *https://...*).
     - Tombol `+ Tautkan Modul`.

---

## 5. Testing & Verifikasi

1. **Unit & Integration Test (`apps/api/tests/plane-issues.test.ts`):**
   - `POST .../research-links/` membuat link baru dengan status 201.
   - `GET .../research-links/` mengembalikan list link + status `research_required`.
   - `DELETE .../research-links/:linkId` menghapus link dengan status 200.
   - Tiket dengan `research_required = true` tanpa link ditolak saat PATCH state ke `review` (422 `RESEARCH_LINK_REQUIRED`).
   - Setelah link ditambahkan, tiket berhasil pindah ke `review`.
2. **Quality Gate:**
   - `pnpm --filter stackgate-api check:types` & `check:lint` pass.
   - `pnpm --filter stackgate-api test` -> 100% pass.
   - `pnpm --filter web check:types`, `check:lint`, dan `build` pass.
3. **Verifikasi E2E Browser:**
   - Buka detail tiket di production browser, tambahkan link riset, uji toggle dan alert visual.
