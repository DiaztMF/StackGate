// Demo seeder via HTTPS API (DB port langsung diblokir dari jaringan lokal).
// Aditif dan idempoten: berhenti bila project slug sudah ada.
// Jalankan: ALLOW_DEMO_SEED=1 pnpm --filter stackgate-api exec tsx src/db/seed-demo.ts
// Opsional: SEED_API_BASE=https://stackgate-api.vercel.app (default).

const API_BASE = process.env.SEED_API_BASE ?? "https://stackgate-api.vercel.app";
const SLUG = "stackgate";
const PROJECT_SLUG = "website-profil-klien-demo";

type Session = { cookie: string };

async function api(session: Session | null, path: string, init?: RequestInit): Promise<unknown> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (session) headers.Cookie = session.cookie;
  const extra = init?.headers ? Object.fromEntries(new Headers(init.headers).entries()) : {};
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers: { ...headers, ...extra } });
  if (!res.ok) throw new Error(`${init?.method ?? "GET"} ${path} => ${res.status}: ${await res.text()}`);
  const text = await res.text();
  return text ? (JSON.parse(text) as unknown) : null;
}

async function signIn(email: string): Promise<Session> {
  const res = await fetch(`${API_BASE}/auth/sign-in`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "password" }),
  });
  if (!res.ok) throw new Error(`sign-in ${email} => ${res.status}`);
  const jar = res.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
  return { cookie: jar };
}

async function main(): Promise<void> {
  if (process.env.ALLOW_DEMO_SEED !== "1") throw new Error("Refusing to seed demo: set ALLOW_DEMO_SEED=1");
  const pm = await signIn("pm@local.dev");
  const lead = await signIn("lead@local.dev");

  const existing = (await api(pm, `/api/workspaces/${SLUG}/projects`)) as Array<{ slug?: string; id: string }>;
  if (existing.some((p) => p.slug === PROJECT_SLUG)) {
    console.log("demo project already exists, skipping");
    return;
  }
  const project = (await api(pm, `/api/workspaces/${SLUG}/projects`, {
    method: "POST",
    body: JSON.stringify({ name: "Website Profil — Klien Demo", identifier: "WPD" }),
  })) as { id: string };
  const projectId = project.id;

  const states = (await api(pm, `/api/workspaces/${SLUG}/projects/${projectId}/states`)) as Array<{
    id: string;
    key: string;
  }>;
  const stateId = (key: string): string => {
    const found = states.find((s) => s.key === key);
    if (!found) throw new Error(`Missing state ${key}`);
    return found.id;
  };

  const members = (await api(
    pm,
    `/api/workspaces/${SLUG}/projects/${projectId}/members`,
  )) as Array<{ id: string; member: { email: string } }>;
  const userId = (email: string): string => {
    const found = members.find((m) => m.member.email === email);
    if (!found) throw new Error(`Missing member ${email}`);
    return found.id;
  };
  const produksiId = userId("produksi@local.dev");
  const risetId = userId("riset@local.dev");

  const createTicket = async (input: {
    name: string;
    description: string;
    assignee: string;
    priority: string;
    researchRequired?: boolean;
    researchLink?: { url: string; label: string };
  }): Promise<string> => {
    const created = (await api(pm, `/api/workspaces/${SLUG}/projects/${projectId}/issues`, {
      method: "POST",
      body: JSON.stringify({
        name: input.name,
        description_html: input.description,
        assignee_ids: [input.assignee],
        priority: input.priority,
      }),
    })) as { id: string };
    if (input.researchRequired) {
      await api(pm, `/api/workspaces/${SLUG}/projects/${projectId}/issues/${created.id}`, {
        method: "PATCH",
        body: JSON.stringify({ research_required: true }),
      });
    }
    if (input.researchLink) {
      await api(pm, `/api/workspaces/${SLUG}/projects/${projectId}/issues/${created.id}/research-links`, {
        method: "POST",
        body: JSON.stringify({ ...input.researchLink, required: true }),
      });
    }
    return created.id;
  };
  const moveTo = async (session: Session, ticketId: string, key: string, note?: string): Promise<void> => {
    await api(session, `/api/workspaces/${SLUG}/projects/${projectId}/issues/${ticketId}`, {
      method: "PATCH",
      body: JSON.stringify({ state_id: stateId(key), ...(note ? { note } : {}) }),
    });
  };
  const checkGates = async (ticketId: string, count: number): Promise<void> => {
    const data = (await api(lead, `/api/workspaces/${SLUG}/projects/${projectId}/issues/${ticketId}/gate-checks`)) as {
      items: Array<{ id: string }>;
    };
    await Promise.all(
      data.items.slice(0, count).map((item) =>
        api(lead, `/api/workspaces/${SLUG}/projects/${projectId}/issues/${ticketId}/gate-checks/${item.id}`, {
          method: "PATCH",
          body: JSON.stringify({ checked: true }),
        }),
      ),
    );
  };
  const comment = async (session: Session, ticketId: string, text: string): Promise<void> => {
    await api(session, `/api/workspaces/${SLUG}/projects/${projectId}/issues/${ticketId}/comments`, {
      method: "POST",
      body: JSON.stringify({ comment_stripped: text }),
    });
  };

  const t1 = await createTicket({
    name: "Halaman beranda — potong desain ke HTML",
    description: "Iris desain Figma halaman beranda jadi HTML responsif, mengacu modul riset grid.",
    assignee: produksiId,
    priority: "high",
    researchRequired: true,
    researchLink: { url: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout", label: "MDN: CSS Grid Layout" },
  });
  const t2 = await createTicket({
    name: "Form kontak — validasi dan anti spam",
    description: "Validasi sisi klien dan server, tambah honeypot anti spam, uji kirim email.",
    assignee: produksiId,
    priority: "medium",
  });
  await moveTo(pm, t2, "in-development");
  const produksi = await signIn("produksi@local.dev");
  await comment(produksi, t2, "API email klien belum kasih kredensial SMTP, menunggu balasan.");
  const t3 = await createTicket({
    name: "Galeri produk — optimasi gambar",
    description: "Kompres 40 foto produk, lazy-load, ukur ulang skor Pagespeed.",
    assignee: produksiId,
    priority: "medium",
    researchRequired: true,
    researchLink: { url: "https://web.dev/articles/optimize-images", label: "web.dev: Optimasi gambar" },
  });
  await moveTo(pm, t3, "in-development");
  const t4 = await createTicket({
    name: "Navigasi mobile — menu hamburger",
    description: "Menu hamburger animasi, fokus keyboard, uji di 3 ukuran layar.",
    assignee: produksiId,
    priority: "high",
    researchRequired: true,
    researchLink: { url: "https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/", label: "W3C APG: pola disclosure nav" },
  });
  await moveTo(pm, t4, "in-development");
  await moveTo(pm, t4, "review");
  await checkGates(t4, 3);
  await comment(lead, t4, "Tinggal self-test di layar kecil, sisanya rapi.");
  const t5 = await createTicket({
    name: "Footer dan peta lokasi",
    description: "Footer 3 kolom plus sematan peta lokasi toko.",
    assignee: risetId,
    priority: "low",
  });
  await moveTo(pm, t5, "in-development");
  await moveTo(pm, t5, "review");
  await checkGates(t5, 1);
  const t6 = await createTicket({
    name: "Deploy awal ke staging",
    description: "Deploy staging, cek env, serahkan link ke klien untuk umpan balik.",
    assignee: produksiId,
    priority: "urgent",
  });
  await moveTo(pm, t6, "in-development");
  await moveTo(pm, t6, "review");
  await checkGates(t6, 4);
  await moveTo(lead, t6, "ready");

  console.log(`demo seeded project ${projectId} tickets ${[t1, t2, t3, t4, t5, t6].join(",")}`);
}
void main();
