"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { estadoGetic, formatFechaLarga, type Reporte } from "@/lib/reportes";
import type { DatosPanel, GasIngeniero, Nota, Solicitud } from "@/lib/supervisor";

const C = {
  amber: "#9a6710", amberBg: "#faeecb",
  green: "#126b4f", greenBg: "#d8efe4",
  red: "#a82a2a", redBg: "#fbe0e0",
  slate: "#54616f", slateBg: "#e8ebee",
  blue: "#1f539f", blueBg: "#e1ebfb",
};
const card: React.CSSProperties = { background: "var(--surface-2)", border: "0.5px solid var(--border)", borderRadius: 10 };
const label: React.CSSProperties = { fontSize: 11, color: "var(--text-muted)" };
const titSec: React.CSSProperties = { fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", margin: "0 0 8px" };

function pillGas(estado: string): { color: string; bg: string; texto: string } {
  switch (estado) {
    case "autorizada":
    case "aprobada": return { color: C.green, bg: C.greenBg, texto: "Autorizada" };
    case "finalizada": return { color: C.slate, bg: C.slateBg, texto: "Cargada" };
    case "rechazada": return { color: C.red, bg: C.redBg, texto: "Rechazada" };
    case "error": return { color: C.red, bg: C.redBg, texto: "Error" };
    default: return { color: C.amber, bg: C.amberBg, texto: "Enviada" };
  }
}
function Pill({ estado }: { estado: string }) {
  const p = pillGas(estado);
  return <span style={{ fontSize: 11, fontWeight: 500, color: p.color, background: p.bg, padding: "2px 9px", borderRadius: 20, whiteSpace: "nowrap" }}>{p.texto}</span>;
}
function estadoActivo(estado: string | null): { color: string; bg: string; texto: string } {
  switch (estadoGetic(estado)) {
    case "Asignado": return { color: C.blue, bg: C.blueBg, texto: "Asignado" };
    case "Confirmado": return { color: C.slate, bg: C.slateBg, texto: "Confirmado" };
    case "LlegadaSitio": return { color: C.green, bg: C.greenBg, texto: "En sitio" };
    default: return { color: C.slate, bg: C.slateBg, texto: "Sin asignar" };
  }
}
function Dato({ t, v, full }: { t: string; v: React.ReactNode; full?: boolean }) {
  return <div style={full ? { gridColumn: "1 / -1" } : undefined}><div style={label}>{t}</div><div style={{ fontSize: 13 }}>{v}</div></div>;
}
function iniciales(n: string) { const p = n.trim().split(/\s+/).filter(Boolean); return ((p[0]?.[0] ?? "?") + (p[1]?.[0] ?? "")).toUpperCase(); }
function fechaDe(v: unknown) { return v ? formatFechaLarga(String(v)) : "—"; }

export default function PanelSupervisor({ datos }: { datos: DatosPanel }) {
  const router = useRouter();
  const [sec, setSec] = useState<string | null>(null);
  const [modal, setModal] = useState<React.ReactNode | null>(null);
  useEffect(() => { const id = setInterval(() => router.refresh(), 25000); return () => clearInterval(id); }, [router]);

  const tabs = [
    { id: "notas", label: "Notas internas" },
    { id: "gas", label: "Solicitudes de gasolina" },
    { id: "activos", label: "Folios activos" },
    { id: "cerrados", label: "Reportes cerrados" },
  ];

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "16px 14px", display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <b style={{ fontSize: 20 }}>Panel de supervisión</b>
        <button onClick={() => router.refresh()} style={{ fontSize: 13 }}>Actualizar</button>
      </div>

      <Resumen r={datos.resumen} />
      <Ingenieros lista={datos.ingenieros} />

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {tabs.map((t) => {
          const on = sec === t.id;
          return (
            <button key={t.id} onClick={() => setSec(on ? null : t.id)}
              style={{ fontSize: 13, fontWeight: 500, padding: "9px 13px", borderRadius: 10, cursor: "pointer",
                background: on ? "var(--text-accent)" : "var(--surface-2)", color: on ? "#fff" : "var(--text-primary)",
                border: `1px solid ${on ? "var(--text-accent)" : "var(--border)"}` }}>
              {t.label}
            </button>
          );
        })}
      </div>

      {sec === "notas" && <Notas datos={datos} />}
      {sec === "gas" && <Gasolina lista={datos.gasolina} abrir={setModal} />}
      {sec === "activos" && <Activos lista={datos.activos} notas={datos.notasPorFolio} />}
      {sec === "cerrados" && <Cerrados lista={datos.cerrados} notas={datos.notasPorFolio} abrir={setModal} />}

      {modal && <Modal onClose={() => setModal(null)}>{modal}</Modal>}
    </div>
  );
}

function Resumen({ r }: { r: DatosPanel["resumen"] }) {
  const tile = (t: string, v: number, color?: string) => (
    <div style={{ background: "var(--surface-1)", borderRadius: 10, padding: 12 }}>
      <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{t}</div>
      <div style={{ fontSize: 26, fontWeight: 500, color }}>{v}</div>
    </div>
  );
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
      {tile("Folios activos", r.activos)}
      {tile("En pausa", r.pausa, C.amber)}
      {tile("Vencidos", r.vencidos, C.red)}
      {tile("Gasolina pendiente", r.gasPendiente)}
    </div>
  );
}

function Ingenieros({ lista }: { lista: DatosPanel["ingenieros"] }) {
  const chip = (c: string, bg: string, t: string) => <span style={{ fontSize: 11, color: c, background: bg, padding: "2px 9px", borderRadius: 20 }}>{t}</span>;
  return (
    <div>
      <p style={titSec}>Avance por ingeniero</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 10 }}>
        {lista.length === 0 && <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Sin ingenieros registrados.</p>}
        {lista.map((p) => (
          <div key={p.id} style={{ ...card, padding: "10px 12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#2C2C2A", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>{iniciales(p.nombre)}</div>
              <b style={{ fontSize: 14, flex: 1 }}>{p.nombre}</b>
              <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{p.activos} activos</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {chip(C.blue, C.blueBg, `Tomados ${p.tomados}`)}
              {chip(C.slate, C.slateBg, `Confirmados ${p.confirmados}`)}
              {chip(C.green, C.greenBg, `En sitio ${p.enSitio}`)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Notas({ datos }: { datos: DatosPanel }) {
  const activoPorFolio = new Map(datos.activos.map((r) => [r.folio, r]));
  const items: { folio: string; cr: string | null; tienda: string | null; n: Nota }[] = [];
  for (const [folio, notas] of Object.entries(datos.notasPorFolio)) {
    const r = activoPorFolio.get(folio);
    if (!r) continue; // solo folios abiertos
    for (const n of notas) items.push({ folio, cr: r.cr, tienda: r.tienda, n });
  }
  items.sort((a, b) => b.n.created_at.localeCompare(a.n.created_at));
  return (
    <div>
      <p style={titSec}>Notas internas · solo de folios abiertos</p>
      {items.length === 0 && <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Sin notas en folios abiertos.</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map(({ folio, cr, tienda, n }) => (
          <div key={n.id} style={{ ...card, padding: "10px 12px" }}>
            <div style={{ fontSize: 13 }}><span style={{ fontVariantNumeric: "tabular-nums" }}>{folio}</span> · {cr} - {tienda}</div>
            <div style={{ fontSize: 13 }}>{n.texto}</div>
            <div style={label}><b>{n.nombre ?? "—"}</b> · {formatFechaLarga(n.created_at)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DetalleGas({ s }: { s: Solicitud }) {
  const d = (s.datos ?? {}) as Record<string, unknown>;
  const rechazada = s.estado === "rechazada";
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <b style={{ fontSize: 16 }}>Solicitud de gasolina</b>
        <Pill estado={s.estado} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 12px" }}>
        <Dato t="Monto solicitado" v={d.monto != null ? `$${d.monto}` : "—"} />
        <Dato t="Monto autorizado" v={d.monto_autorizado != null ? `$${d.monto_autorizado}` : "—"} />
        <Dato t="Kilometraje" v={d.kilometraje != null ? String(d.kilometraje) : "—"} />
        <Dato t="Folio foráneo" v={d.foraneo === true ? "Sí" : "No"} />
        <Dato full t={rechazada ? "Motivo de rechazo" : "Mensaje de autorización"} v={d.motivo_getic != null ? String(d.motivo_getic) : "—"} />
        <Dato t="Fecha de solicitud" v={fechaDe(s.created_at)} />
        <Dato t="Evidencia enviada" v={fechaDe(d.evidencia_at)} />
      </div>
    </>
  );
}

function Gasolina({ lista, abrir }: { lista: GasIngeniero[]; abrir: (n: React.ReactNode) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const con = lista.filter((g) => g.actual || g.historial.length);
  return (
    <div>
      <p style={titSec}>Solicitudes de gasolina · por ingeniero</p>
      {con.length === 0 && <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Sin solicitudes.</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {con.map((g) => {
          const todas = [g.actual, ...g.historial].filter(Boolean) as Solicitud[];
          const ab = open === g.id;
          return (
            <div key={g.id} style={{ ...card, overflow: "hidden" }}>
              <button onClick={() => setOpen(ab ? null : g.id)} style={headStyle}>
                <div style={avatarStyle}>{iniciales(g.nombre)}</div>
                <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 500 }}>{g.nombre}</div><div style={label}>{todas.length} solicitudes</div></div>
                <Chevron up={ab} />
              </button>
              {ab && (
                <div style={{ borderTop: "0.5px solid var(--border)", padding: "4px 0" }}>
                  {todas.map((s) => {
                    const d = (s.datos ?? {}) as Record<string, unknown>;
                    return (
                      <button key={s.id} onClick={() => abrir(<DetalleGas s={s} />)} style={{ ...rowBtn }}>
                        <span style={{ flex: 1, fontVariantNumeric: "tabular-nums" }}>${`${d.monto ?? "—"}`} · {fechaDe(s.created_at)}</span>
                        <Pill estado={s.estado} />
                        <Chevron right />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Activos({ lista, notas }: { lista: Reporte[]; notas: Record<string, Nota[]> }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div>
      <p style={titSec}>Folios activos · en pausa primero</p>
      {lista.length === 0 && <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Sin folios activos.</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {lista.map((r) => {
          const ab = open === r.folio;
          const pausa = !!r.pausado_at;
          const est = estadoActivo(r.estado);
          const ns = notas[r.folio] ?? [];
          return (
            <div key={r.folio} style={{ ...card, overflow: "hidden", ...(pausa ? { border: "1px solid #EF9F27" } : {}) }}>
              <button onClick={() => setOpen(ab ? null : r.folio)} style={headStyle}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}><span style={{ fontVariantNumeric: "tabular-nums" }}>{r.folio}</span> · {r.ingeniero_asignado ?? "—"}</div>
                  <div style={label}>{r.cr} - {r.tienda}</div>
                </div>
                {pausa && <span style={{ fontSize: 11, color: C.amber, background: C.amberBg, padding: "2px 9px", borderRadius: 20 }}>En pausa</span>}
                <span style={{ fontSize: 11, color: est.color, background: est.bg, padding: "2px 9px", borderRadius: 20 }}>{est.texto}</span>
                <Chevron up={ab} />
              </button>
              {ab && (
                <div style={{ borderTop: "0.5px solid var(--border)", padding: "10px 12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "9px 12px" }}>
                  <Dato full t="Grupo · Concepto" v={`${r.grupo_servicio ?? "—"} · ${r.concepto_servicio ?? "—"}`} />
                  {pausa && <Dato t="En pausa desde" v={fechaDe(r.pausado_at)} />}
                  <Dato full t="Notas internas" v={ns.length === 0 ? "Sin notas." : ns.map((n) => `${n.nombre ?? "—"}: ${n.texto}`).join("  ·  ")} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DetalleCerrado({ r, notas }: { r: Reporte; notas: Nota[] }) {
  const coms = (r.comentarios ?? []).filter((c) => c.tipo !== "historia");
  return (
    <>
      <b style={{ fontSize: 16 }}><span style={{ fontVariantNumeric: "tabular-nums" }}>{r.folio}</span> · {r.cr} - {r.tienda}</b>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 12px", marginTop: 12 }}>
        <Dato t="Creación" v={fechaDe(r.fecha_creacion)} />
        <Dato t="Aceptada" v={fechaDe(r.fecha_asignacion)} />
        <Dato t="Llegada a sitio" v={fechaDe(r.fecha_llegada)} />
        <Dato t="Cerrada" v={fechaDe(r.fecha_resuelto)} />
        <Dato full t="Grupo · Concepto" v={`${r.grupo_servicio ?? "—"} · ${r.concepto_servicio ?? "—"}`} />
        <Dato full t="Solución" v={r.solucion ?? "—"} />
        <Dato t="VoBo" v={r.vobo ?? "—"} />
        <Dato t="Atiende" v={r.atiende ?? "—"} />
      </div>
      <div style={{ marginTop: 12 }}>
        <div style={label}>Comentarios de Getic</div>
        {coms.length === 0 ? <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Sin comentarios.</div> :
          coms.map((c, i) => <div key={i} style={{ fontSize: 13 }}><b>{c.usuario ?? "—"}:</b> {c.mensaje} <span style={label}>· {c.fecha}</span></div>)}
      </div>
      <div style={{ marginTop: 12 }}>
        <div style={label}>Notas internas</div>
        {notas.length === 0 ? <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Sin notas internas.</div> :
          notas.map((n) => <div key={n.id} style={{ fontSize: 13 }}><b>{n.nombre ?? "—"}:</b> {n.texto} <span style={label}>· {formatFechaLarga(n.created_at)}</span></div>)}
      </div>
    </>
  );
}

function Cerrados({ lista, notas, abrir }: { lista: Reporte[]; notas: Record<string, Nota[]>; abrir: (n: React.ReactNode) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const grupos = new Map<string, Reporte[]>();
  for (const r of lista) {
    const k = r.ingeniero_asignado ?? "—";
    const arr = grupos.get(k) ?? [];
    arr.push(r);
    grupos.set(k, arr);
  }
  const porIng = [...grupos.entries()];
  return (
    <div>
      <p style={titSec}>Reportes cerrados · por quién lo cerró (reciente → viejo)</p>
      {porIng.length === 0 && <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Sin reportes cerrados.</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {porIng.map(([nombre, folios]) => {
          const ab = open === nombre;
          return (
            <div key={nombre} style={{ ...card, overflow: "hidden" }}>
              <button onClick={() => setOpen(ab ? null : nombre)} style={headStyle}>
                <div style={avatarStyle}>{iniciales(nombre)}</div>
                <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 500 }}>{nombre}</div><div style={label}>{folios.length} cerrados</div></div>
                <Chevron up={ab} />
              </button>
              {ab && (
                <div style={{ borderTop: "0.5px solid var(--border)", padding: "4px 0" }}>
                  {folios.map((r) => (
                    <button key={r.folio} onClick={() => abrir(<DetalleCerrado r={r} notas={notas[r.folio] ?? []} />)} style={rowBtn}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13 }}><span style={{ fontVariantNumeric: "tabular-nums" }}>{r.folio}</span> · {r.cr} - {r.tienda}</div>
                        <div style={label}>cerrado {fechaDe(r.fecha_resuelto)}</div>
                      </div>
                      <Chevron right />
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 100 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--surface-2)", color: "var(--text-primary)", borderRadius: 12, border: "0.5px solid var(--border)", maxWidth: 460, width: "100%", maxHeight: "85vh", overflowY: "auto", padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: -6 }}>
          <button onClick={onClose} aria-label="Cerrar" style={{ fontSize: 20, background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const headStyle: React.CSSProperties = { width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "none", border: "none", textAlign: "left", cursor: "pointer", color: "var(--text-primary)" };
const rowBtn: React.CSSProperties = { width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", background: "none", border: "none", textAlign: "left", cursor: "pointer", color: "var(--text-primary)" };
const avatarStyle: React.CSSProperties = { width: 28, height: 28, borderRadius: "50%", background: "#2C2C2A", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600 };

function Chevron({ up, right }: { up?: boolean; right?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ flex: "none", transform: right ? "rotate(-90deg)" : up ? "rotate(180deg)" : "none" }}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
