# Fitur: Superadmin Panel Design Spec

Tanggal: 2026-09-18
Status: Disetujui
Root proyek: `D:\Project\Web Project\Enuma\StackGate`

## 1. Goal

Menambahkan peran keempat, `superadmin`, dengan panel administrasi khusus untuk (a) mengelola akun user (buat, ubah role, aktifkan/nonaktifkan, reset password) dan (b) mengelola seluruh proyek di workspace (buat, ubah nama, arsipkan, kelola anggota) tanpa harus menjadi anggota proyek itu sendiri.

Akun `diaztmuhammadfirmansyah@gmail.com` menjadi superadmin pertama (bootstrap manual setelah migrasi).

Di luar scope: menutup lubang pendaftaran publik (`enable_signup`), bypass quality gate, audit trail lintas proyek, sistem invitation Plane. Ini dicatat sebagai risiko/pekerjaan terpisah, bukan bagian dari fitur ini.

---

## 2. Keputusan Arsitektur

### 2.1 Panel baru, bukan reuse halaman `/settings/members` Plane

Halaman members bawaan Plane tidak cocok secara struktural:
- Dropdown ubah-role di sana meng-encode role numerik generik Plane (`ADMIN=20 / MEMBER=15 / GUEST=5`), bukan 4 role string StackGate (`student/lead/pm/superadmin`). Tidak bisa dipetakan lossless.
- Tombol undang anggota (`SendWorkspaceInvitationModal`) memanggil endpoint invitation yang tidak ada di backend ini sama sekali.

Memaksakan reuse berarti membangun sistem invitation Plane penuh (tabel `invitations`, email SMTP, alur accept/decline) — jauh di luar scope yang diminta.

**Keputusan:** halaman baru `/settings/superadmin`, komponen StackGate-native, endpoint backend baru `/api/admin/*`. Tidak menyentuh infrastruktur invitation Plane.

### 2.2 Model role

`roleEnum` bertambah nilai keempat: `student | lead | pm | superadmin` (migrasi `ALTER TYPE ... ADD VALUE`, aditif, aman).

- **Level workspace** (`workspaceRoleNumber`, dipakai Plane FE untuk visibilitas menu generik): `pm` dan `superadmin` sama-sama `20` (ADMIN). `lead` tetap `15`, `student` tetap `5` (guest).
- **Level proyek** (`roleNumber`): `superadmin` juga `20`; `pm` `20`; `lead`/`student` `15`.
- Karena `pm` dan `superadmin` sama-sama `20` di mata Plane, **nav-item panel superadmin tidak digerbang lewat sistem permission numerik Plane** — ia dirender hanya jika `currentUser.role === "superadmin"` (string asli dari `/api/users/me/`, pola yang sudah dipakai `quality-gate-widget.tsx` untuk membedakan `lead` vs role lain). Ini presisi: `pm` tidak pernah melihat link-nya, bukan sekadar diblokir setelah klik.
- Proteksi sesungguhnya tetap di server: middleware `requireSuperadmin`.

### 2.3 Kolom baru (aditif, backward-compatible)

```sql
ALTER TYPE role ADD VALUE 'superadmin';
ALTER TABLE users ADD COLUMN is_active boolean NOT NULL DEFAULT true;
ALTER TABLE projects ADD COLUMN archived_at timestamp;
```

`projects.archived_at` kebetulan sudah diharapkan bentuknya oleh FE — saat ini `toPlaneProject()` hardcode `archived_at: null`. Kolom baru ini tinggal menggantikan nilai hardcode itu dengan nilai asli.

---

## 3. Backend

### 3.1 Guard

`apps/api/src/admin/guard.ts` (baru):

```ts
export const requireSuperadmin = createMiddleware<{ Variables: { user: AuthUser } }>(async (c, next) => {
  const user = await resolvePlaneUser(c);          // cookie-based, sama seperti planeWorkspaces/planeIssues
  if (!user) return unauthorized(c);
  if (user.role !== "superadmin") {
    return c.json({ error: { code: "FORBIDDEN", message: "Hanya superadmin yang boleh mengakses ini" } }, 403);
  }
  c.set("user", { id: user.id, email: user.email, role: user.role });
  await next();
});
```

Pakai `resolvePlaneUser` (cookie `sg_refresh` + fallback Bearer), **bukan** `authMiddleware` yang Bearer-only — web app browser session tidak pernah mengirim header `Authorization`, konsisten dengan seluruh endpoint `/api/workspaces/*`.

### 3.2 Endpoint baru — `apps/api/src/admin/routes.ts`, dimount di `/api/admin`

| Method | Path | Fungsi |
|---|---|---|
| GET | `/api/admin/users` | List semua user (id, email, name, role, is_active, created_at) |
| POST | `/api/admin/users` | Buat user baru `{email, name, password, role}` |
| PATCH | `/api/admin/users/:id` | Ubah `{role?, is_active?, name?}` |
| POST | `/api/admin/users/:id/reset-password` | `{password}` → rehash langsung (bukan token email) |
| GET | `/api/admin/projects` | List semua proyek + jumlah anggota |
| POST | `/api/admin/projects` | Buat proyek (reuse logika default-states dari `planeWorkspaces.post("/:slug/projects")`) |
| PATCH | `/api/admin/projects/:id` | `{name?, archived?}` — `archived: true` → set `archived_at = now()`; `false` → `null` |
| GET | `/api/admin/projects/:id/members` | List anggota proyek |
| POST | `/api/admin/projects/:id/members` | Tambah anggota `{userId, role}` |
| PATCH | `/api/admin/projects/:id/members/:userId` | Ubah role anggota di proyek itu |
| DELETE | `/api/admin/projects/:id/members/:userId` | Keluarkan dari proyek |

Semua route pakai `requireSuperadmin`. Response mengikuti format `{data: ...}` / `{error: {code, message}}` StackGate-native (bukan format Plane), sama seperti `apps/api/src/tickets/routes.ts`.

### 3.3 Safety rail

- `PATCH /api/admin/users/:id`: menolak (422) kalau target adalah diri sendiri **dan** perubahan akan membuatnya bukan superadmin lagi (`role` diubah dari superadmin, atau `is_active: false`), **dan** dia satu-satunya superadmin aktif tersisa. Query cepat: `count(*) where role='superadmin' and is_active=true`.
- Password baru minimal 8 karakter (samakan aturan dengan `sign-up`).

### 3.4 Test baru

`apps/api/tests/admin.test.ts`: guard menolak non-superadmin (403), superadmin bisa list/create/patch user, reset password lalu login dengan password baru berhasil, self-lockout ditolak, project CRUD + member CRUD dasar.

---

## 4. Frontend

### 4.1 Routing & nav

- `packages/constants/src/settings/workspace.ts`: tambah entri `WORKSPACE_SETTINGS["superadmin"]` (`href: /settings/superadmin`, `access: [ADMIN]` — gerbang kasar, presisi sesungguhnya di langkah berikut), masukkan ke `GROUPED_WORKSPACE_SETTINGS[ADMINISTRATION]`.
- `apps/web/core/components/settings/workspace/sidebar/item-categories.tsx`: filter tambahan — item berkunci `"superadmin"` hanya lolos kalau `currentUser?.role === "superadmin"` (import `useUser`, satu kondisi tambahan di `accessibleItems.filter`).
- Route baru: `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/superadmin/page.tsx` + `header.tsx`, mengikuti pola persis sibling `members/`. Guard render: kalau `currentUser?.role !== "superadmin"` → `<NotAuthorizedView />` (pola yang sudah ada).

### 4.2 Komponen (baru, `apps/web/core/components/admin/`)

- `users-table.tsx` — tabel: nama, email, role (native `<select>` — bukan custom dropdown, supaya tidak menambah konsumen `useAnchoredPosition` baru untuk panel internal ber-traffic rendah), status aktif (toggle `Button`), tombol reset password (buka modal kecil, satu input password + konfirmasi).
- `projects-table.tsx` — tabel: nama, jumlah anggota, status (aktif/arsip), tombol arsipkan/pulihkan, tombol kelola anggota (buka `project-members-modal.tsx` — list anggota + native `<select>` role + tombol keluarkan + form tambah anggota).
- `create-user-modal.tsx`, `create-project-modal.tsx` — form sederhana, reuse `@plane/ui` `Modal`/`Button`/`Input` yang sudah dipakai komponen lain di app ini.

### 4.3 Service — `packages/services/src/admin/`

`AdminService extends APIService` (pola sama seperti `AuthService`), method: `listUsers`, `createUser`, `updateUser`, `resetPassword`, `listProjects`, `createProject`, `updateProject`, `listProjectMembers`, `addProjectMember`, `updateProjectMember`, `removeProjectMember`. Semua unwrap `.then(r => r?.data)`, rethrow `.catch(e => { throw e?.response; })` — konvensi wajib repo ini.

Tidak pakai MobX store terpisah (data admin bukan state yang di-share lintas komponen aplikasi) — `useSWR` langsung di level halaman, sama seperti pola PM dashboard (`f4-pm-dashboard`).

---

## 5. Migrasi & Bootstrap

1. `drizzle-kit generate` → migration file baru (enum value + 2 kolom).
2. `drizzle-kit migrate` terhadap Neon yang sama dengan produksi (satu database untuk dev lokal & prod, seperti sesi sebelumnya).
3. Setelah migrasi jalan, satu `UPDATE users SET role = 'superadmin' WHERE email = 'diaztmuhammadfirmansyah@gmail.com'` — akun sudah `pm` dari langkah sebelumnya, tinggal naik satu tingkat.

---

## 6. Testing & Verifikasi

- `apps/api`: `check:types`, `check:lint`, `pnpm test` (termasuk `admin.test.ts` baru) — wajib hijau sebelum dianggap selesai (`AGENTS.md`).
- `apps/web`: `check:types` — wajib hijau.
- Verifikasi manual via browser (Chrome extension) sebagai `pm` (memastikan nav item **tidak** muncul) dan sebagai `superadmin` (memastikan CRUD user & proyek berjalan, termasuk reset password → login ulang berhasil).
