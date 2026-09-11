# Rebrand Metadata and External Component Cleanup Design Spec

Tanggal: 2026-09-11
Status: Disetujui
Root proyek: `D:\Project\Web Project\Enuma\StackGate`

## 1. Goal

Membersihkan identitas dan link open-source eksternal Plane Software Inc. dari antarmuka pengguna serta memperbarui seluruh metadata dan SEO menjadi identitas **StackGate** yang berfokus pada *Project Management & Quality Gate Platform*. Visual branding bawaan UI tetap dipertahankan.

---

## 2. Rincian Perubahan

### A. Metadata & SEO Branding
Memperbarui seluruh salinan dan metadata situs agar tidak merujuk ke Plane atau tagline open-source lamanya, serta tidak mencantumkan istilah "internship" / "magang".

1. **`packages/constants/src/metadata.ts`:**
   - `SITE_NAME`: `StackGate | Modern Project Management & Quality Gate Platform`
   - `SITE_TITLE`: `StackGate | Modern Project Management & Quality Gate Platform`
   - `SITE_DESCRIPTION`: `Modern project management platform with strict quality gates to plan, track, and deliver work items.`
   - `SITE_KEYWORDS`: `project management, quality gates, work items, kanban, software development, tracking, collaboration`
   - `SITE_URL`: `https://stackgate-web.vercel.app/`
   - `TWITTER_USER_NAME`: `StackGate`

2. **`apps/web/app/root.tsx`:**
   - `APP_TITLE`: `StackGate | Modern Project Management & Quality Gate Platform`
   - Metadata og/twitter description diselaraskan dengan `SITE_DESCRIPTION`.

3. **`apps/web/core/components/core/page-title.tsx`:**
   - Fallback title bawaan saat props title kosong diubah menjadi `StackGate`.

4. **PWA Manifests (`apps/web/public/manifest.json` & `apps/web/public/site.webmanifest.json`):**
   - `name`: `StackGate`
   - `short_name`: `StackGate`
   - `description`: `Modern project management platform with strict quality gates.`

---

### B. Pembersihan Komponen Eksternal Plane & Open-Source

1. **Navbar - Tombol Star GitHub:**
   - File: `apps/web/core/components/navigation/top-navigation-root.tsx`
   - Hapus pemanggilan komponen `<StarUsOnGitHubLink />` dari bar navigasi atas.

2. **Navbar - Help Menu Dropdown:**
   - File: `apps/web/core/components/workspace/sidebar/help-section/root.tsx`
   - Hapus link eksternal yang mengarah ke domain Plane:
     - `https://go.plane.so/p-docs` (Documentation)
     - `mailto:sales@plane.so` (Contact Sales)
     - `https://forum.plane.so` (Forum)
     - `<PlaneVersionNumber />`
   - Pertahankan fitur lokal: aksi modal `Keyboard shortcuts` dan `What's new`.

3. **Sidebar - Edition Badge ("Community" / Upgrade Modal):**
   - File: `apps/web/core/components/workspace/edition-badge.tsx`
   - Jadikan komponen merender `null` (tanpa tombol Community dan tanpa dialog modal upgrade berbayar Plane). Sidebar bawah menjadi bersih.

4. **Halaman Autentikasi - Terms & Legal Link:**
   - File: `apps/web/core/components/account/terms-and-conditions.tsx`
   - Hapus atau kosongkan teks disclaimer hukum yang menautkan ke `https://plane.so/legals/terms-and-conditions/` dan `https://plane.so/legals/privacy-policy/`.

---

## 3. Testing & Verifikasi

1. **Standard Quality Gate:**
   - `pnpm --filter @plane/constants check:types`
   - `pnpm --filter web check:types`
   - `pnpm --filter web check:lint`
   - `pnpm --filter web build`
2. **Verifikasi Browser / Playwright:**
   - Halaman `/` dan `/stackgate/`: verifikasi `<title>` dan `<meta name="description">` bernilai StackGate.
   - Navbar: tombol "Star us on GitHub" tidak ada lagi.
   - Ikon Help menu: tidak memiliki tautan ke `plane.so`.
   - Sidebar: tombol badge "Community" tidak muncul lagi di bagian bawah.
   - Halaman login: teks syarat ketentuan ke `plane.so` tidak tampil.
