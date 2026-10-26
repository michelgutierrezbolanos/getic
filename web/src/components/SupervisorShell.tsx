"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import "./supervisor.css";

const ITEMS = [
  { href: "/", label: "Panel", icon: "M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z" },
  { href: "/mapa", label: "Mapa", icon: "M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14" },
  { href: "/horarios", label: "Horarios", icon: "M4 5h16v15H4zM4 9h16M8 3v4M16 3v4" },
];

/** Marco del supervisor: barra lateral fija (logo, Panel, Mapa, Horarios, sesión). */
export default function SupervisorShell({ nombre, children }: { nombre: string; children: React.ReactNode }) {
  const router = useRouter();
  const path = usePathname();

  async function salir() {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="sv">
      <aside className="sv-lado">
        <Link href="/" className="sv-logo" style={{ color: "#fff", textDecoration: "none" }}>
          <div className="sv-logo-g">G</div>
          <div>
            <b>Getic</b>
            <span>Vallarta</span>
          </div>
        </Link>
        <div className="sv-franja">
          <i style={{ width: 30, background: "#f28c28" }} />
          <i style={{ width: 15, background: "#0f8b8d" }} />
          <i style={{ width: 7, background: "#fff" }} />
        </div>

        <nav className="sv-nav">
          {ITEMS.map((it) => (
            <Link key={it.href} href={it.href} className={path === it.href ? "activo" : ""}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d={it.icon} />
              </svg>
              {it.label}
            </Link>
          ))}
        </nav>

        <div style={{ flex: 1 }} />

        <div className="sv-usuario">
          {nombre}
          <small>Supervisor</small>
          <button className="sv-salir" onClick={salir}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="sv-main">{children}</main>
    </div>
  );
}
