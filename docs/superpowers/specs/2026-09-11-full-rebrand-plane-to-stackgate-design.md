# Full UI & Copy Rebrand to StackGate Design Spec

Tanggal: 2026-09-11
Status: Disetujui
Root proyek: `D:\Project\Web Project\Enuma\StackGate`

## 1. Goal

Mengganti seluruh elemen teks, slogan, salinan sambutan, dan logo lockup bermerek Plane yang terlihat di UI menjadi **StackGate** (fokus: Project Management & Quality Gate Platform), sehingga siap dipresentasikan tanpa kebocoran nama atau slogan Plane.

---

## 2. Area Rebranding

### A. Halaman Auth & Login
1. **Header Copy (`apps/web/core/components/account/auth-forms/auth-header.tsx`):**
   - Header: `"Work in all dimensions."` → `"Project Quality & Gate Control."`
   - Subheader: `"Welcome back to Plane."` → `"Welcome to StackGate."`
   - Sign up subheader: `"Create an account to start managing projects with quality gates."`
2. **Footer (`apps/web/core/components/auth-screens/footer.tsx`):**
   - `"Join 10,000+ teams building with Plane"` → Dihapus / diganti `"Trusted Software Project Delivery"`
   - Logo partner dummy (Zerodha, Sony, Dolby, Accenture): disembunyikan atau dibersihkan agar tampilan login clean & fokus.
3. **Top Header Brand (`apps/web/core/components/auth-screens/header.tsx` & `packages/propel/src/icons/brand/plane-lockup.tsx`):**
   - Mengganti teks/logo `PlaneLockup` menjadi logo monogram **StackGate** (huruf S modern + teks "StackGate").

### B. Dashboard & Quickstart Guide Copy
1. **`packages/i18n/src/locales/en/home.json`:**
   - `"Most things start with a project in Plane."` → `"Most things start with a project in StackGate."`
   - `"Make Plane yours."` → `"Customize StackGate."`
2. **`packages/i18n/src/locales/en/workspace.json`:**
   - `"To start using Plane, you need to create or join a workspace."` → `"To start using StackGate, you need to create or join a workspace."`
   - `"Welcome to Plane, we are excited to have you here."` → `"Welcome to StackGate, we are excited to have you here."`
   - `"Everything starts with a project in Plane"` → `"Everything starts with a project in StackGate"`
3. **`packages/i18n/src/locales/en/auth.json`:**
   - `"new_to_plane": "New to Plane?"` → `"new_to_plane": "New to StackGate?"`

### C. Komponen Brand Lockup Lain
1. `apps/web/core/components/onboarding/header.tsx`: ganti `PlaneLockup` dengan `StackGateLockup`.
2. `apps/web/core/components/instance/not-ready-view.tsx`: ganti `PlaneLockup` dengan `StackGateLockup`.

---

## 3. Testing & Verifikasi

1. **Standard Quality Gate:**
   - `pnpm --filter @plane/i18n build`
   - `pnpm --filter web check:types`
   - `pnpm --filter web check:lint`
   - `pnpm --filter web build`
2. **Browser & Production Verification:**
   - Halaman `/`: login screen menampilkan slogan StackGate dan logo StackGate.
   - Halaman `/stackgate/`: quickstart card bertuliskan StackGate.
   - Console: tidak ada error runtime.
