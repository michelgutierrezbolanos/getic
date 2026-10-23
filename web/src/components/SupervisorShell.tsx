"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import GeticLogo from "./GeticLogo";

const ITEMS = [
  { href: "/", label: "Panel de supervisión", icon: "M3 11l9-8 9 8M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" },
  { href: "/horarios", label: "Horarios", icon: "M12 8v4l3 2 M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18" },
];

export default function SupervisorShell({ nombre, children }: { nombre: string; children: React.ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const [abierto, setAbierto] = useState(false);

  async function salir() {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <>
      <header className="jqm-header getic-header">
        <button
          aria-label="Menú"
          onClick={() => setAbierto(true)}
          style={{
            position: "absolute",
            left: 10,
            top: "50%",
            transform: "translateY(-50%)",
            width: 36,
            height: 36,
            borderRadius: 9,
            background: "#1f2a44",
            border: "none",
            color: "#fff",
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <Link href="/" aria-label="Inicio">
          <GeticLogo width={80} color="#111" />
        </Link>
      </header>

      {abierto && <div className="panel-velo" onClick={() => setAbierto(false)} />}

      <aside className={`panel panel-izq ${abierto ? "abierto" : ""}`} aria-hidden={!abierto} style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "12px 0 10px", textAlign: "center" }}>
          <GeticLogo width="70%" color="#111" />
        </div>
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <div style={{ fontWeight: 700 }}>{nombre}</div>
          <div style={{ fontSize: 13, color: "#777" }}>Supervisor</div>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {ITEMS.map((it) => {
            const activo = path === it.href;
            return (
              <Link
                key={it.href}
                href={it.href}
                onClick={() => setAbierto(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "11px 14px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: activo ? "#1f2a44" : "#fff",
                  color: activo ? "#fff" : "#1b2026",
                  fontWeight: 600,
                  fontSize: 14.5,
                  textDecoration: "none",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={it.icon} />
                </svg>
                {it.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ flex: 1 }} />

        <button
          onClick={salir}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "11px 14px",
            borderRadius: 8,
            border: "1px solid #f0b4b4",
            background: "#fff",
            color: "#c0392b",
            fontWeight: 600,
            fontSize: 14.5,
            cursor: "pointer",
            marginBottom: 24,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          Cerrar sesión
        </button>
      </aside>

      {children}
    </>
  );
}
