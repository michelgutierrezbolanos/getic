"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { estadoGetic, formatFechaLarga, type Reporte } from "@/lib/reportes";
import type { DatosPanel, GasIngeniero, Nota, Solicitud } from "@/lib/supervisor";

// Colores
const C = { amber: "#854F0B", amberBg: "#FAEEDA", green: "#0F6E56", greenBg: "#E1F5EE", red: "#A32D2D", redBg: "#FCEBEB", gray: "#444441", grayBg: "#F1EFE8", blue: "#0C447C", blueBg: "#E6F1FB" };

function pillGas(estado: string): { color: string; bg: string; texto: string } {
  switch (estado) {
    case "autorizada":
    case "aprobada":
      return { color: C.green, bg: C.greenBg, texto: "Autorizada" };
    case "finalizada":
      return { color: C.gray, bg: C.grayBg, texto: "Cargada" };
    case "rechazada":
      return { color: C.red, bg: C.redBg, texto: "Rechazada" };
    case "error":
      return { color: C.red, bg: C.redBg, texto: "Error" };
    default:
      return { color: C.amber, bg: C.amberBg, texto: "Enviada" };
  }
}

function Pill({ estado }: { estado: string }) {
  const p = pillGas(estado);
  return (
    <span style={{ fontSize: 11, fontWeight: 500, color: p.color, background: p.bg, padding: "2px 9px", borderRadius: 20, whiteSpace: "nowrap" }}>
      {p.texto}
    </span>
  );
}

const card: React.CSSProperties = { background: "var(--surface-2)", border: "0.5px solid var(--border)", borderRadius: 10 };
const label: React.CSSProperties = { fontSize: 11, color: "var(--text-muted)" };
const titSec: React.CSSProperties = { fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", margin: "0 0 8px" };

function Dato({ t, v }: { t: string; v: React.ReactNode }) {
  return (
    <div>
      <div style={label}>{t}</div>
      <div style={{ fontSize: 13 }}>{v}</div>
    </div>
  );
}

export default function PanelSupervisor({ datos }: { datos: DatosPanel }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 25000);
    return () => clearInterval(id);
  }, [router]);

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "16px 14px", display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <b style={{ fontSize: 20 }}>Panel de supervisión</b>
        <button onClick={() => router.refresh()} style={{ fontSize: 13 }}>Actualizar</button>
      </div>

      <Resumen r={datos.resumen} />
      <Ingenieros lista={datos.ingenieros} />
      <NotasRecientes lista={datos.notasRecientes} />
      <GasolinaActual lista={datos.gasolina} />
      <HistorialGas lista={datos.gasolina} />
      <Activos lista={datos.activos} notas={datos.notasPorFolio} />
      <Cerrados lista={datos.cerrados} notas={datos.notasPorFolio} />
    </div>
  );
}

function NotasRecientes({ lista }: { lista: Nota[] }) {
  if (!lista.length) return null;
  return (
    <div>
      <p style={titSec}>Notas internas recientes</p>
      <div style={{ ...card, overflow: "hidden" }}>
        {lista.map((n, i) => (
          <div key={n.id} style={{ padding: "9px 12px", borderTop: i ? "0.5px solid var(--border)" : undefined }}>
            <div style={{ fontSize: 13 }}>
              <b>{n.folio}</b> · {n.nombre ?? "—"}
            </div>
            <div style={{ fontSize: 13 }}>{n.texto}</div>
            <div style={label}>{formatFechaLarga(n.created_at)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Resumen({ r }: { r: DatosPanel["resumen"] }) {
  const tile = (t: string, v: number, color?: string) => (
    <div style={{ background: "var(--surface-1)", borderRadius: 10, padding: 12 }}>
      <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{t}</div>
      <div style={{ fontSize: 24, fontWeight: 500, color }}>{v}</div>
    </div>
  );
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
      {tile("Folios activos", r.activos)}
      {tile("En pausa", r.pausa, C.amber)}
      {tile("Vencidos", r.vencidos, C.red)}
      {tile("Gasolina pendiente", r.gasPendiente)}
    </div>
  );
}

function Badge({ icon, texto, color, bg }: { icon: string; texto: string; color: string; bg: string }) {
  return (
    <span style={{ fontSize: 11, color, background: bg, padding: "2px 8px", borderRadius: 20, whiteSpace: "nowrap" }}>
      <i className={`ti ti-${icon}`} aria-hidden="true" /> {texto}
    </span>
  );
}

function Ingenieros({ lista }: { lista: DatosPanel["ingenieros"] }) {
  return (
    <div>
      <p style={titSec}>Avance por ingeniero</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 10 }}>
        {lista.length === 0 && <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Sin ingenieros registrados.</p>}
        {lista.map((p) => (
          <div key={p.id} style={{ ...card, padding: "10px 12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#2C2C2A", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>
                {iniciales(p.nombre)}
              </div>
              <b style={{ fontSize: 14, flex: 1 }}>{p.nombre}</b>
              <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{p.activos} activos</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              <Badge icon="hand-finger" texto={`Tomados ${p.tomados}`} color={C.blue} bg={C.blueBg} />
              <Badge icon="truck" texto={`Confirmados ${p.confirmados}`} color={C.gray} bg={C.grayBg} />
              <Badge icon="map-pin" texto={`En sitio ${p.enSitio}`} color={C.green} bg={C.greenBg} />
              <Badge icon="player-pause" texto={`Pausa ${p.pausa}`} color={C.amber} bg={C.amberBg} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DetalleGas({ s }: { s: Solicitud }) {
  const d = s.datos ?? {};
  const rechazada = s.estado === "rechazada";
  const fecha = (v: unknown) => (v ? formatFechaLarga(String(v)) : "—");
  return (
    <div style={{ padding: "0 12px 10px", borderTop: "0.5px solid var(--border)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 12px", marginTop: 8 }}>
        <Dato t="Monto solicitado" v={d.monto != null ? `$${d.monto}` : "—"} />
        <Dato t="Monto autorizado" v={d.monto_autorizado != null ? `$${d.monto_autorizado}` : "—"} />
        <Dato t="Kilometraje" v={`${d.kilometraje ?? "—"}`} />
        <Dato t="Folio foráneo" v={d.foraneo === true ? "Sí" : "No"} />
        <Dato t="Fecha de solicitud" v={fecha(s.created_at)} />
        <Dato t="Evidencia enviada" v={fecha(d.evidencia_at)} />
      </div>
      {!rechazada && d.motivo_getic ? (
        <div style={{ marginTop: 8 }}>
          <Dato t="Mensaje de autorización" v={`${d.motivo_getic}`} />
        </div>
      ) : null}
      {rechazada ? (
        <div style={{ marginTop: 8 }}>
          <Dato t="Motivo de rechazo" v={`${d.motivo_getic ?? "—"}`} />
        </div>
      ) : null}
    </div>
  );
}

function GasolinaActual({ lista }: { lista: GasIngeniero[] }) {
  const [abierto, setAbierto] = useState<number | null>(null);
  const conActual = lista.filter((g) => g.actual);
  return (
    <div>
      <p style={titSec}>Solicitudes de gasolina (actual)</p>
      {conActual.length === 0 && <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Sin solicitudes activas.</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {conActual.map((g) => {
          const s = g.actual!;
          const d = s.datos ?? {};
          const open = abierto === s.id;
          return (
            <div key={g.id} style={{ ...card, overflow: "hidden" }}>
              <button
                onClick={() => setAbierto(open ? null : s.id)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "none", border: "none", textAlign: "left", cursor: "pointer" }}
              >
                <span style={{ flex: 1, fontSize: 13 }}>
                  <b>{g.nombre}</b> · ${`${d.monto ?? "—"}`}
                  {d.foraneo === true ? <span style={{ color: C.amber }}> · Foráneo</span> : null}
                </span>
                <Pill estado={s.estado} />
                <i className={`ti ti-chevron-${open ? "up" : "down"}`} style={{ fontSize: 18, color: "var(--text-muted)" }} aria-hidden="true" />
              </button>
              {open && <DetalleGas s={s} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HistorialGas({ lista }: { lista: GasIngeniero[] }) {
  const [abierto, setAbierto] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<number | null>(null);
  const conHistorial = lista.filter((g) => g.historial.length);
  return (
    <div>
      <p style={titSec}>Historial de solicitudes de gasolina</p>
      {conHistorial.length === 0 && <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Aún no hay historial.</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {conHistorial.map((g) => {
          const open = abierto === g.id;
          return (
            <div key={g.id} style={{ ...card, overflow: "hidden" }}>
              <button
                onClick={() => setAbierto(open ? null : g.id)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "none", border: "none", textAlign: "left", cursor: "pointer" }}
              >
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#2C2C2A", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>
                  {iniciales(g.nombre)}
                </div>
                <b style={{ flex: 1, fontSize: 14 }}>{g.nombre}</b>
                <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{g.historial.length} solicitudes</span>
                <i className={`ti ti-chevron-${open ? "up" : "down"}`} style={{ fontSize: 18, color: "var(--text-muted)" }} aria-hidden="true" />
              </button>
              {open && (
                <div style={{ borderTop: "0.5px solid var(--border)", padding: "4px 0" }}>
                  {g.historial.map((s) => {
                    const d = s.datos ?? {};
                    const det = detalle === s.id;
                    return (
                      <div key={s.id}>
                        <button
                          onClick={() => setDetalle(det ? null : s.id)}
                          style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", background: "none", border: "none", textAlign: "left", cursor: "pointer" }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13 }}>${`${d.monto ?? "—"}`}</div>
                            <div style={label}>{formatFechaLarga(s.created_at)}</div>
                          </div>
                          <Pill estado={s.estado} />
                          <i className={`ti ti-chevron-${det ? "up" : "right"}`} style={{ fontSize: 16, color: "var(--text-muted)" }} aria-hidden="true" />
                        </button>
                        {det && <DetalleGas s={s} />}
                      </div>
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

function estadoActivo(estado: string | null): { color: string; bg: string; texto: string } {
  switch (estadoGetic(estado)) {
    case "Asignado":
      return { color: C.blue, bg: C.blueBg, texto: "Asignado" };
    case "Confirmado":
      return { color: C.gray, bg: C.grayBg, texto: "Confirmado" };
    case "LlegadaSitio":
      return { color: C.green, bg: C.greenBg, texto: "En sitio" };
    default:
      return { color: C.gray, bg: C.grayBg, texto: "Sin asignar" };
  }
}

function Comentarios({ r }: { r: Reporte }) {
  const coms = (r.comentarios ?? []).filter((c) => c.tipo !== "historia");
  return (
    <div style={{ marginTop: 10 }}>
      <div style={label}>Comentarios de Getic</div>
      {coms.length === 0 ? (
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Sin comentarios.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 4 }}>
          {coms.map((c, i) => (
            <div key={i} style={{ fontSize: 13 }}>
              <b>{c.usuario ?? "—"}:</b> {c.mensaje} <span style={label}>· {c.fecha}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NotasFolio({ notas }: { notas: Nota[] }) {
  return (
    <div style={{ marginTop: 10 }}>
      <div style={label}>Notas internas</div>
      {notas.length === 0 ? (
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Sin notas internas.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 4 }}>
          {notas.map((n) => (
            <div key={n.id} style={{ fontSize: 13 }}>
              <b>{n.nombre ?? "—"}:</b> {n.texto} <span style={label}>· {formatFechaLarga(n.created_at)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TarjetaFolio({ r, notas, cerrado }: { r: Reporte; notas: Nota[]; cerrado: boolean }) {
  const [open, setOpen] = useState(false);
  const pausa = !!r.pausado_at;
  const est = estadoActivo(r.estado);
  return (
    <div style={{ ...card, overflow: "hidden", ...(pausa && !cerrado ? { border: "1px solid #EF9F27" } : {}) }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "none", border: "none", textAlign: "left", cursor: "pointer" }}
      >
        <i className={cerrado ? "ti ti-circle-check" : "ti ti-clipboard-list"} style={{ fontSize: 18, color: cerrado ? "#1D9E75" : "var(--text-secondary)" }} aria-hidden="true" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{r.folio} · {r.ingeniero_asignado ?? "—"}</div>
          <div style={label}>{r.cr} - {r.tienda}{cerrado ? ` · cerrado ${formatFechaLarga(r.fecha_resuelto)}` : ""}</div>
        </div>
        {!cerrado && pausa && <span style={{ fontSize: 11, color: C.amber, background: C.amberBg, padding: "2px 9px", borderRadius: 20, whiteSpace: "nowrap" }}>En pausa</span>}
        {!cerrado && <span style={{ fontSize: 11, color: est.color, background: est.bg, padding: "2px 9px", borderRadius: 20, whiteSpace: "nowrap" }}>{est.texto}</span>}
        {notas.length > 0 && <span style={{ fontSize: 11, color: C.amber, background: C.amberBg, padding: "2px 7px", borderRadius: 20 }}><i className="ti ti-note" aria-hidden="true" /> {notas.length}</span>}
        <i className={`ti ti-chevron-${open ? "up" : "down"}`} style={{ fontSize: 18, color: "var(--text-muted)" }} aria-hidden="true" />
      </button>
      {open && (
        <div style={{ borderTop: "0.5px solid var(--border)", padding: "10px 12px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 12px" }}>
            <Dato t="Grupo · Concepto" v={`${r.grupo_servicio ?? "—"} · ${r.concepto_servicio ?? "—"}`} />
            <Dato t={cerrado ? "Atiende" : "Estado"} v={cerrado ? r.atiende ?? "—" : r.estado ?? "—"} />
          </div>
          {!cerrado && pausa && (
            <div style={{ marginTop: 8 }}>
              <Dato t="En pausa desde" v={formatFechaLarga(r.pausado_at)} />
            </div>
          )}
          {cerrado && (
            <>
              <div style={{ marginTop: 8 }}>
                <Dato t="Solución" v={r.solucion ?? "—"} />
              </div>
              <div style={{ marginTop: 8 }}>
                <Dato t="VoBo" v={r.vobo ?? "—"} />
              </div>
            </>
          )}
          <Comentarios r={r} />
          <NotasFolio notas={notas} />
        </div>
      )}
    </div>
  );
}

function Activos({ lista, notas }: { lista: Reporte[]; notas: Record<string, Nota[]> }) {
  return (
    <div>
      <p style={titSec}>Folios activos (en pausa primero)</p>
      {lista.length === 0 && <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Sin folios activos.</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {lista.map((r) => (
          <TarjetaFolio key={r.folio} r={r} notas={notas[r.folio] ?? []} cerrado={false} />
        ))}
      </div>
    </div>
  );
}

function Cerrados({ lista, notas }: { lista: Reporte[]; notas: Record<string, Nota[]> }) {
  return (
    <div>
      <p style={titSec}>Reportes cerrados (historial)</p>
      {lista.length === 0 && <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Sin reportes cerrados.</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {lista.slice(0, 50).map((r) => (
          <TarjetaFolio key={r.folio} r={r} notas={notas[r.folio] ?? []} cerrado />
        ))}
      </div>
    </div>
  );
}

function iniciales(nombre: string) {
  const p = nombre.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return "?";
  if (p.length === 1) return p[0][0].toUpperCase();
  return (p[0][0] + p[1][0]).toUpperCase();
}
