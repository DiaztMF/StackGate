# StackGate MVP Design Spec

Tanggal: 2026-09-09
Status: menunggu review user
Root proyek: `D:\Project\Web Project\Enuma\StackGate`

## Goal

Membangun StackGate, platform manajemen tiket untuk software house yang melibatkan siswa magang, dengan base UI Plane yang dipakai apa adanya dan backend baru yang ringan dan gratis.

## Latar Belakang

Software house tempat PKL menangani banyak pesanan klien sekaligus. Pelaksana teknisnya siswa magang (pemula/menengah), terbagi divisi riset dan produksi. Tiga masalah utama:

1. Tidak ada gerbang kualitas: tiket ditandai selesai sepihak karena "yang penting jalan di lokal", revisi panjang via WhatsApp tanpa jejak di tiket.
2. Riset dan produksi putus: standar/modul baru dari divisi riset tidak sampai ke siswa produksi, solusi dibuat ulang dan inkonsisten.
3. Visibilitas rendah: PM tidak tahu siapa stuck, idle, atau overload sampai deadline terancam, penilaian magang subjektif.

## Keputusan Terkunci

| Nomor | Keputusan | Alasan |
|---|---|---|
| D1 | Opsi B: FE Plane dipertahankan, BE ditulis ulang | Mempertahankan nilai FE Plane, BE Django terlalu berat untuk target gratis |
| D2 | UI dipakai 1:1 dari file existing (`apps/web` + `packages/*`), hanya lapisan `packages/services` ditulis ulang sebagai adapter | Komponen tidak memanggil `fetch` langsung; semua HTTP terpusat di `APIService` (`packages/services/src/api.service.ts`) dengan path seperti `/api/public/anchor/...` dan `response?.data` |
| D3 | BE baru: Hono (Node runtime Vercel Functions) + Drizzle + Neon Postgres + Upstash Redis | Hono cold-start kecil, Drizzle ~35KB vs Prisma ~230KB, Neon dan Upstash ada free tier |
| D4 | `apps/live` (Hocuspocus/Yjs) jalan di Render 512MB, Redis pakai Upstash external | Functions Vercel tidak mendukung WebSocket persistent; 512MB cukup untuk puluhan dokumen concurrent |
| D5 | Worker berat ditinggalkan: tidak ada Celery, beat, RabbitMQ | Email dikirim sync, notifikasi/activity insert sync, cleanup via Vercel Cron |
| D6 | `apps/admin` (God-mode, port 3001, `/god-mode`) dan `apps/space` (share publik SSR, port 3002, `/spaces`) dibekukan | Bukan core loop PM; `space` butuh endpoint publik unauth dan SSR server sehingga beban BE dan deploy dobel |
| D7 | Satu repo monorepo `StackGate`, deployable pisah (web statis, API functions, live Render) | Kode 1 folder, runtime tetap pisah karena batasan serverless |
| D8 | Auth: JWT Bearer umur 15 menit di memori FE + refresh rotation httpOnly cookie umur 7 hari | Adapter services ditulis ulang sehingga tidak wajib meniru cookie session Django |
| D9 | Email via Resend (sync di request), storage via Cloudflare R2 (pengganti MinIO) | Keduanya ada free tier, tanpa worker |
| D10 | Lisensi fork FE Plane tetap AGPL-3.0; kode BE dan adapter baru milik sendiri | Konsekuensi hukum fork: modifikasi FE yang di-host publik wajib open-source |

## Roles

- `student`: siswa magang, pelaksana tiket.
- `lead`: lead developer / mentor, pemegang gerbang kualitas.
- `pm`: project manager, visibilitas dan penugasan lintas proyek klien.

## State Tiket dan Matriks Transisi

States per proyek klien: `Backlog` → `In Development` → `Quality Gate Review` → `Client Ready`.

| Transisi | Boleh dilakukan | Syarat |
|---|---|---|
| Backlog → In Development | student (assignee), lead, pm | tiket punya assignee |
| In Development → Quality Gate Review | student (assignee), lead, pm | deskripsi dan research link wajib sudah terisi bila tiket menandainya required |
| Quality Gate Review → Client Ready | lead saja | semua item gate checklist checked + research link required terisi + tidak ada komentar unresolved dari lead |
| Quality Gate Review → In Development (reject) | lead saja | wajib menyertakan catatan revisi |
| State apa pun → Backlog | lead, pm | wajib alasan tertulis |

Setiap transisi menulis baris ke `ticket_transitions` (siapa, kapan, dari, ke). FE menyembunyikan tombol yang tidak boleh, BE menolak dengan 403 bila dipaksa via API.

## Fitur MVP

### F1. Papan Proyek Klien (Kanban Board)

Reuse board Plane 1:1 (drag-and-drop Pragmatic, filter Views). Kolom dirender dari `states` proyek sehingga urutannya Backlog, In Development, Quality Gate Review, Client Ready. Guard transisi di atas ditegakkan di BE; FE menonaktifkan drop target yang tidak diizinkan per role.

Kriteria terima: student tidak bisa memindahkan kartu ke Client Ready lewat UI maupun API langsung; lead bisa approve dan reject dengan catatan.

### F2. Gerbang Validasi (Strict Gate Rule)

Setiap tiket punya gate checklist (contoh item: kode jalan sesuai acceptance, tidak ada secret ter-commit, mengikuti modul riset yang ditautkan, sudah self-test). Hanya lead yang bisa check/uncheck. Transisi ke Client Ready ditolak BE bila ada item belum checked.

Kriteria terima: tiket tanpa checklist lengkap selalu 422 saat dipaksa ke Client Ready; riwayat check tercatat (siapa, kapan).

### F3. Tautan Modul Riset (Research Asset Attachment)

Tiket punya daftar research links (`url`, `label`, flag `required`). Saat membuat tiket, lead/pm bisa menandai satu link sebagai wajib. Student tidak bisa memindahkan tiket ke Review bila link wajib belum ada. Link tampil di panel deskripsi tiket, reuse area attachments Plane.

Kriteria terima: tiket bertanda required tanpa link selalu ditolak masuk Review; link tampil dan bisa diklik dari kartu tiket.

### F4. Log Riwayat, Durasi, dan Dashboard PM

- Komentar teknis dan catatan revisi (termasuk reject dari lead) tersimpan per tiket, reuse feed komentar Plane.
- Setiap perubahan state mencatat timestamp sehingga durasi per state (time-in-state) bisa dihitung dari `ticket_transitions`.
- Dashboard PM per proyek: jumlah tiket per state per anggota, daftar tiket stuck (di state yang sama lebih dari `STUCK_AFTER_DAYS = 3` hari), daftar anggota idle (nol tiket aktif di In Development/Review), daftar overload (lebih dari `OVERLOAD_THRESHOLD = 5` tiket aktif).
- Data ini dipakai sebagai dasar objektif penilaian magang.

Kriteria terima: PM melihat stuck/idle/overload tanpa bertanya manual; durasi tiap tiket konsisten dengan riwayat transisinya.

## Non-Goals MVP (disepakati ditunda atau dibuang)

- Export CSV/PDF dan analytic plot export (butuh worker long-running, timeout di Functions).
- Webhook keluar dengan retry.
- Automation rules dan agregasi burndown berat.
- `apps/admin` dan `apps/space`.
- Cleanup/hard-delete terjadwal otomatis (fase berikutnya via Vercel Cron + endpoint `/api/cron/cleanup`).

## Arsitektur

```
Vercel Static: web (fork apps/web + packages, adapter services)
  → Vercel Functions: Hono API
    → Neon Postgres via Drizzle (pg Pool module-scope + attachDatabasePool)
    → Upstash Redis (session/refresh, rate-limit)
    → Resend (email sync) + Cloudflare R2 (file)
  → Render 512MB: apps/live (Hocuspocus/Yjs) → Upstash Redis
```

Satu repo, tiga deployable. FE dan API beda origin sehingga API memakai CORS allowlist eksplisit dan JWT Bearer (D8), bukan cookie lintas domain.

## Permukaan API (Hono)

- Auth: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, `POST /api/auth/refresh`
- Workspace/proyek: CRUD `/api/workspaces`, `/api/projects`, `/api/projects/:id/states`, `/api/projects/:id/members`
- Tiket: `GET/POST /api/projects/:id/tickets`, `GET/PATCH/DELETE /api/tickets/:id`, `POST /api/tickets/:id/transition` (`{to_state}`), `POST /api/tickets/:id/comments`, `GET/POST /api/tickets/:id/research-links`, `GET/POST /api/tickets/:id/gate-checks`, `PATCH /api/gate-checks/:id`
- PM: `GET /api/projects/:id/workload`, `GET /api/projects/:id/bottlenecks`
- Cron (fase berikutnya): `POST /api/cron/cleanup` dengan secret header

Semua response sukses: `{data: ...}`. Error: `{error: {code, message}}` dengan kode `VALIDATION_ERROR`, `FORBIDDEN_TRANSITION`, `GATE_INCOMPLETE`, `RESEARCH_LINK_REQUIRED`, `UNAUTHORIZED`, `NOT_FOUND`.

## Model Data (Neon Postgres via Drizzle)

`users` (id, email unik, nama, role, password_hash), `workspaces`, `workspace_members` (user, workspace, role), `projects` (workspace, nama klien, slug), `project_members`, `states` (project, key, nama, urutan), `tickets` (project, state, judul, deskripsi, assignee, reporter, research_required bool), `ticket_transitions` (ticket, from_state, to_state, actor, at), `gate_check_items` (ticket, label, checked_by, checked_at), `research_links` (ticket, url, label, required, created_by), `comments` (ticket, author, body), `refresh_tokens` (user, hash, expires_at, revoked_at).

Seed tiap proyek baru: empat states sesuai matriks di atas plus satu gate checklist default (empat item contoh dari F2).

## Alur Data Siklus Tiket

PM/lead buat tiket di proyek klien → tautkan research link wajib bila ada → student kerjakan di In Development → student pindahkan ke Review (BE validasi research link) → lead review: approve (checklist lengkap → Client Ready) atau reject (catatan → In Development, tercatat) → PM pantau workload/stuck dari dashboard.

## Error Handling

Hono: middleware Zod validation (400), auth (401), guard transisi dan gate (403/422 dengan kode di atas), handler global tanpa bocor stack trace di production, log terstruktur per request. FE: memakai state error SWR/axios yang sudah ada di Plane; adapter services memetakan tiap kode error baru ke pesan Indonesia via satu fungsi `toUserMessage(code)` di `packages/services` sehingga tidak ada pesan mentah dari server yang tampil ke student.

## Testing

- API: vitest, fokus utama matriks transisi (student ditolak ke Client Ready, lead tanpa checklist ditolak, tiket tanpa research required ditolak ke Review), tambah CRUD tiket dan workload stuck/idle/overload.
- FE: `tsc --noEmit` dan build `apps/web` lolos setelah adapter services diganti; drag-and-drop terlarang nonaktif per role. Dicek manual per matriks.
- Live: smoke test 2 klien edit dokumen yang sama via Render.

## Risiko

- AGPL fork FE: publikasi wajib open-source modifikasi FE (D10).
- Render 512MB: bila dokumen kolaboratif besar dan concurrent tinggi, naikkan ke 1GB atau pindah Hocuspocus Cloud.
- Vercel Hobby timeout ~10 detik: alasan export dan agregasi berat keluar dari MVP.
- Skema `@plane/types` berubah upstream: adapter dikunci ke versi fork, update Plane dilakukan manual per rilis.

## Constraints Global

- Node `>=22.22.0`, pnpm `11.10.0`, React Router 8, React 19.
- Free tier saja untuk MVP: Vercel Hobby, Neon free, Upstash free, Resend free, R2 free, Render 512MB.
- Bahasa UI mengikuti bawaan Plane; tidak ada rewrite visual di MVP.
