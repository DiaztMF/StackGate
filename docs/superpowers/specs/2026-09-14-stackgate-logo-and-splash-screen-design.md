# StackGate Logo & Animated Splash Screen Design Spec

Tanggal: 2026-09-14
Status: Disetujui
Root proyek: `D:\Project\Web Project\Enuma\StackGate`

## 1. Goal

Menciptakan identitas visual (logo mark & wordmark) resmi untuk **StackGate** dengan konsep *The Layered Stack & Portal* (2D Flat Geometric, Tech Blue & Indigo/Cyan), mengeksplorasi dan menyimpannya langsung ke canvas Figma pengguna melalui Figma MCP, serta mengimplementasikan komponen **Animated Loading / Splash Screen** modern berbasis vektor SVG + CSS keyframes untuk menggantikan GIF bawaan Plane.

---

## 2. Spesifikasi Logo & Brand Identity

### A. Geometri Logo Mark
- **Konsep:** Tiga lempeng horizontal bertingkat (*software stack*) dengan potongan sudut simetris 15° yang menyisakan ruang negatif (*negative space*) di bagian tengah untuk membentuk siluet gerbang (*portal*) sekaligus alur huruf **S**.
- **Dimensi Master:** 256x256 px bounding box.
- **Rincian Layer:**
  - *Top Layer:* Lempeng atas dengan kemiringan dinamis di ujung kanan.
  - *Middle Layer:* Lempeng tengah dengan celah portal dan aksen highlight Cyan.
  - *Bottom Layer:* Lempeng bawah dengan kemiringan simetris di ujung kiri.
  - *Corner Radius:* 4px–6px untuk kehalusan tampilan modern.

### B. Palet Warna (Tech Blue & Indigo/Cyan)
- **Primary Gradient:** Linear 135deg dari `#3B82F6` (Electric Blue) ke `#4F46E5` (Deep Indigo).
- **Accent Highlight:** `#06B6D4` (Cyan) pada layer tengah gerbang.
- **Monokromatik (Dark Mode):** `#FFFFFF` / `#E2E8F0` dengan variasi opacity 100%, 80%, 60%.
- **Monokromatik (Light Mode):** `#0F172A` (Slate 900) dengan variasi opacity.

### C. Tipografi Wordmark
- Teks: **StackGate**
- Komposisi: `Stack` (Font weight 500 / Medium), `Gate` (Font weight 700 / Bold).

---

## 3. Integrasi Figma MCP

- **Target Pembuatan:**
  - Team Key: `team::1613365354803641480` (`DIAZT MUHAMMAD FIRMANSYAH's team`).
  - Nama File: `StackGate - Brand Identity & Design System`.
- **Struktur Canvas Figma:**
  1. *Frame Logo Exploration:* Logo mark ukuran 256px, 64px, dan 16px.
  2. *Frame Brand Lockup:* Logo mark + teks "StackGate" dalam varian Light dan Dark.
  3. *Frame Color & Tokens:* Kartu palet warna `#3B82F6`, `#4F46E5`, `#06B6D4`.

---

## 4. Spesifikasi Animated Loading / Splash Screen

### A. Arsitektur Komponen
- Menggantikan implementasi gambar raster GIF lama (`logo-spinner-dark.gif` dan `logo-spinner-light.gif`) di:
  - `apps/web/core/components/common/logo-spinner.tsx`
- Komponen baru menggunakan **vektor SVG murni** dengan animasi CSS GPU-accelerated.
- Keunggulan: Tajam di layar Retina, ukuran < 2 KB, responsif instan, tidak ada lag gambar.

### B. Koreografi Gerakan (Staggered Stack & Portal Pulse)
- Durasi Siklus: 1.6 detik (infinite loop, timing cubic-bezier `ease-in-out`).
- Fase 1 (Glide & Float): Tiga lempeng bergerak halus dengan offset horizontal staggered (lempeng atas bergeser halus ke kanan, lempeng bawah bergeser ke kiri).
- Fase 2 (Glow & Snap): Lempeng tengah memancarkan kilau aksen Cyan dan ketiga lempeng merapat lembut membentuk alur huruf S dengan pulsing glow.

---

## 5. File yang Dimodifikasi / Dibuat

1. `packages/propel/src/icons/brand/plane-logo.tsx`: Menggunakan vektor logo mark StackGate baru.
2. `packages/propel/src/icons/brand/plane-lockup.tsx`: Menggunakan kombinasi logo mark + wordmark baru.
3. `apps/web/core/components/common/logo-spinner.tsx`: Menggunakan animasi vektor SVG StackGate baru.
4. File Figma di cloud Figma pengguna via Figma MCP tool.

---

## 6. Testing & Verifikasi

1. **Figma Validation:** File berhasil terbuat dan URL Figma dapat dibuka oleh pengguna untuk evaluasi/revisi.
2. **Standard Quality Gate:**
   - `pnpm --filter @makeplane/propel build` exit 0.
   - `pnpm --filter web check:types` exit 0.
   - `pnpm --filter web check:lint` exit 0.
   - `pnpm --filter web build` exit 0.
3. **Browser E2E Verification:**
   - Halaman loading/transisi me-render spinner vektor baru secara tajam dan berulang mulus tanpa error 418 atau error console.
