"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { clavePrioridad, estadoGetic, formatFechaLarga, tiempoEnVivo, type Reporte } from "@/lib/reportes";
import type { DatosPanel, Nota, Solicitud } from "@/lib/supervisor";

type Tab = "activos" | "cerrados" | "gasolina" | "notas";
type Gas = Solicitud & { ingeniero: string };
type Detalle = { tipo: "folio"; r: Reporte } | { tipo: "gas"; s: Gas };

const PRIORIDAD: Record<string, { franja: string; fondo: string; color: string }> = {
  critica: { franja: "#7f1d1d", fondo: "#7f1d1d", color: "#ffffff" },
  alta: { franja: "#e53935", fondo: "#fcebeb", color: "#a32d2d" },
  media: { franja: "#f28c28", fondo: "#faeeda", color: "#854f0b" },
  baja: { franja: "#0f8b8d", fondo: "#e6f4f4", color: "#0b5f60" },
};
const prio = (p: string | null) => PRIORIDAD[clavePrioridad(p)];
const NOMBRE_PRIORIDAD: Record<string, string> = { critica: "crítica", alta: "alta", media: "media", baja: "baja" };

const ESTADO: Record<string, { texto: string; fondo: string; color: string }> = {
  Asignado: { texto: "Asignado", fondo: "#f3f4f6", color: "#374151" },
  Confirmado: { texto: "Confirmado", fondo: "#e6f4f4", color: "#0b5f60" },
  LlegadaSitio: { texto: "En sitio", fondo: "#fdf0e3", color: "#9a4a06" },
  "Sin Asignar": { texto: "Sin asignar", fondo: "#fcebeb", color: "#a32d2d" },
  Resuelto: { texto: "Cerrado", fondo: "#dcfce7", color: "#166534" },
};

const GAS: Record<string, { texto: string; fondo: string; color: string }> = {
  autorizada: { texto: "Autorizada", fondo: "#e6f4f4", color: "#0b5f60" },
  aprobada: { texto: "Autorizada", fondo: "#e6f4f4", color: "#0b5f60" },
  finalizada: { texto: "Cargada", fondo: "#f3f4f6", color: "#374151" },
  rechazada: { texto: "Rechazada", fondo: "#fcebeb", color: "#a32d2d" },
  error: { texto: "Error", fondo: "#fcebeb", color: "#a32d2d" },
  enviada: { texto: "Enviada", fondo: "#faeeda", color: "#854f0b" },
};
const gasEstado = (e: string) => GAS[e] ?? GAS.enviada;

function Chip({ texto, fondo, color }: { texto: string; fondo: string; color: string }) {
  return <span className="sv-chip" style={{ background: fondo, color }}>{texto}</span>;
}
const Pausa = () => <Chip texto="⏸ Pausa" fondo="#fdf0e3" color="#9a4a06" />;

function iniciales(n: string) {
  const p = n.trim().split(/\s+/).filter(Boolean);
  return ((p[0]?.[0] ?? "?") + (p[1]?.[0] ?? "")).toUpperCase();
}
/** "Luis Alberto Arias Cuevas" → "Luis Arias" (nombre + primer apellido). */
const corto = (n: string | null) => {
  const p = (n ?? "—").trim().split(/\s+/);
  if (p.length >= 4) return `${p[0]} ${p[2]}`;
  if (p.length >= 2) return `${p[0]} ${p[1]}`;
  return p[0];
};
const fecha = (v: unknown) => (v ? formatFechaLarga(String(v)) : "—");
const tienda = (r: Pick<Reporte, "cr" | "tienda">) => [r.cr, r.tienda].filter(Boolean).join(" · ");

/** "22h52m" / "1d 4h", o "Vencido". */
function tiempoCorto(r: Reporte, ahora: number) {
  const t = tiempoEnVivo(r, ahora);
  if (!t) return null;
  if (t.vencido) return { vencido: true, texto: "Vencido" };
  const m = t.texto.match(/(?:(\d+)dia\(s\) )?(\d+):(\d{2})/);
  if (!m) return { vencido: false, texto: t.texto };
  const [, d, h, min] = m;
  return { vencido: false, texto: d ? `${d}d ${h}h` : `${h}h${min}m` };
}

function Tiempo({ r, ahora }: { r: Reporte; ahora: number }) {
  const t = tiempoCorto(r, ahora);
  if (!t) return <span className="sv-sub">—</span>;
  return t.vencido ? <Chip texto="Vencido" fondo="#fcebeb" color="#a32d2d" /> : <span style={{ color: "#c2410c", fontWeight: 600 }}>{t.texto}</span>;
}

export default function PanelSupervisor({ datos }: { datos: DatosPanel }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("activos");
  const [busqueda, setBusqueda] = useState("");
  const [detalle, setDetalle] = useState<Detalle | null>(null);
  const [ahora, setAhora] = useState(() => Date.now());

  // Datos frescos cada 25 s; el tiempo restante corre cada 30 s.
  useEffect(() => {
    const a = setInterval(() => router.refresh(), 25000);
    const b = setInterval(() => setAhora(Date.now()), 30000);
    return () => {
      clearInterval(a);
      clearInterval(b);
    };
  }, [router]);

  const gasolina: Gas[] = useMemo(
    () =>
      datos.gasolina
        .flatMap((g) => [g.actual, ...g.historial].filter(Boolean).map((s) => ({ ...(s as Solicitud), ingeniero: g.nombre })))
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [datos.gasolina],
  );
  const porFolio = useMemo(() => new Map([...datos.activos, ...datos.cerrados].map((r) => [r.folio, r])), [datos]);
  const notasAbiertas = useMemo(
    () =>
      Object.entries(datos.notasPorFolio)
        .filter(([folio]) => datos.activos.some((r) => r.folio === folio))
        .flatMap(([, ns]) => ns)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [datos],
  );

  const q = busqueda.trim().toLowerCase();
  const coincide = (...t: (string | null | undefined)[]) => !q || t.some((x) => (x ?? "").toLowerCase().includes(q));
  const conteoPrioridad = (p: string) => datos.activos.filter((r) => clavePrioridad(r.prioridad) === p).length;

  const abrirFolio = (folio: string) => {
    const r = porFolio.get(folio);
    if (r) setDetalle({ tipo: "folio", r });
  };

  const fecha_hoy = new Intl.DateTimeFormat("es-MX", { timeZone: "America/Mexico_City", weekday: "long", day: "numeric", month: "long" }).format(ahora);

  return (
    <>
      <div className="sv-cabecera">
        <div style={{ flex: 1 }}>
          <h1>Panel de supervisión</h1>
          <p>
            {fecha_hoy.charAt(0).toUpperCase() + fecha_hoy.slice(1)} · <span className="sv-vivo">● en vivo</span>
          </p>
        </div>
        <button className="sv-boton" onClick={() => router.refresh()}>
          ↻ Actualizar
        </button>
      </div>

      <div className="sv-kpis">
        <div className="sv-kpi">
          <small>Folios activos</small>
          <b>{datos.resumen.activos}</b>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 4 }}>
            {(["critica", "alta", "media", "baja"] as const).map((p) =>
              conteoPrioridad(p) ? <Chip key={p} texto={`${conteoPrioridad(p)} ${NOMBRE_PRIORIDAD[p]}`} fondo={PRIORIDAD[p].fondo} color={PRIORIDAD[p].color} /> : null,
            )}
          </div>
        </div>
        <div className="sv-kpi">
          <small>En pausa</small>
          <b style={{ color: "#c2410c" }}>{datos.resumen.pausa}</b>
        </div>
        <div className="sv-kpi">
          <small>Vencidos</small>
          <b style={{ color: "#a32d2d" }}>{datos.resumen.vencidos}</b>
        </div>
        <div className="sv-kpi oscuro">
          <small>Gasolina pendiente</small>
          <b>{datos.resumen.gasPendiente}</b>
        </div>
      </div>

      <div className="sv-ings">
        {datos.ingenieros.map((p) => {
          const total = Math.max(1, p.tomados + p.confirmados + p.enSitio);
          return (
            <div key={p.id} className="sv-ing">
              <div className="sv-ing-top">
                <div className="sv-avatar">{iniciales(p.nombre)}</div>
                <b>{p.nombre}</b>
                <span>{p.activos} activos</span>
              </div>
              <div className="sv-barra" title={`Asignados ${p.tomados} · Confirmados ${p.confirmados} · En sitio ${p.enSitio}`}>
                <div style={{ width: `${(p.tomados / total) * 100}%`, background: "#9ca3af" }} />
                <div style={{ width: `${(p.confirmados / total) * 100}%`, background: "#0f8b8d" }} />
                <div style={{ width: `${(p.enSitio / total) * 100}%`, background: "#f28c28" }} />
              </div>
              <div className="sv-leyenda">
                <span><i style={{ background: "#9ca3af" }} />{p.tomados} asignados</span>
                <span><i style={{ background: "#0f8b8d" }} />{p.confirmados} conf.</span>
                <span><i style={{ background: "#f28c28" }} />{p.enSitio} en sitio</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="sv-cuerpo">
        <div className="sv-tarjeta">
          <div className="sv-tabs">
            {(
              [
                ["activos", `Activos · ${datos.activos.length}`],
                ["cerrados", "Cerrados"],
                ["gasolina", "Gasolina"],
                ["notas", "Notas"],
              ] as [Tab, string][]
            ).map(([id, txt]) => (
              <button key={id} className={`sv-tab ${tab === id ? "activo" : ""}`} onClick={() => setTab(id)}>
                {txt}
              </button>
            ))}
            <input className="sv-buscar" placeholder="Buscar folio, tienda, CR, ingeniero…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          </div>

          {tab === "activos" && (
            <TablaFolios
              filas={datos.activos.filter((r) => coincide(r.folio, r.cr, r.tienda, r.ingeniero_asignado))}
              ahora={ahora}
              onAbrir={(r) => setDetalle({ tipo: "folio", r })}
            />
          )}
          {tab === "cerrados" && (
            <TablaCerrados
              filas={datos.cerrados.filter((r) => coincide(r.folio, r.cr, r.tienda, r.ingeniero_asignado, r.solucion))}
              onAbrir={(r) => setDetalle({ tipo: "folio", r })}
            />
          )}
          {tab === "gasolina" && (
            <TablaGas filas={gasolina.filter((s) => coincide(s.ingeniero, String(s.datos?.monto ?? ""), s.estado))} onAbrir={(s) => setDetalle({ tipo: "gas", s })} />
          )}
          {tab === "notas" && (
            <ListaNotas
              notas={notasAbiertas.filter((n) => coincide(n.folio, n.nombre, n.texto, porFolio.get(n.folio)?.tienda))}
              porFolio={porFolio}
              onAbrir={abrirFolio}
            />
          )}
        </div>

        <Actividad datos={datos} gasolina={gasolina} porFolio={porFolio} onFolio={abrirFolio} onGas={(s) => setDetalle({ tipo: "gas", s })} />
      </div>

      {detalle && (
        <Cajon onClose={() => setDetalle(null)}>
          {detalle.tipo === "folio" ? (
            <DetalleFolio r={detalle.r} notas={datos.notasPorFolio[detalle.r.folio] ?? []} ahora={ahora} />
          ) : (
            <DetalleGas s={detalle.s} />
          )}
        </Cajon>
      )}
    </>
  );
}

function TablaFolios({ filas, ahora, onAbrir }: { filas: Reporte[]; ahora: number; onAbrir: (r: Reporte) => void }) {
  if (!filas.length) return <div className="sv-vacio">Sin folios activos.</div>;
  return (
    <table className="sv-tabla">
      <thead>
        <tr>
          <th>Folio</th>
          <th>Tienda</th>
          <th>Ingeniero</th>
          <th>Estado</th>
          <th>Tiempo</th>
        </tr>
      </thead>
      <tbody>
        {filas.map((r) => {
          const e = ESTADO[estadoGetic(r.estado)];
          return (
            <tr key={r.folio} onClick={() => onAbrir(r)}>
              <td style={{ borderLeftColor: prio(r.prioridad)?.franja }}>
                <span className="sv-folio">{r.folio}</span>
                <span className="sv-sub">{clavePrioridad(r.prioridad) === "critica" ? "Crítica" : (r.prioridad ?? "")}</span>
              </td>
              <td>
                {tienda(r)} {r.pausado_at && <Pausa />}
                <span className="sv-sub">{[r.grupo_servicio, r.concepto_servicio].filter(Boolean).join(" · ")}</span>
              </td>
              <td>{corto(r.ingeniero_asignado)}</td>
              <td>{e && <Chip {...e} />}</td>
              <td>
                <Tiempo r={r} ahora={ahora} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function TablaCerrados({ filas, onAbrir }: { filas: Reporte[]; onAbrir: (r: Reporte) => void }) {
  if (!filas.length) return <div className="sv-vacio">Sin reportes cerrados.</div>;
  return (
    <table className="sv-tabla">
      <thead>
        <tr>
          <th>Folio</th>
          <th>Tienda</th>
          <th>Cerró</th>
          <th>Cerrado</th>
          <th>Solución</th>
        </tr>
      </thead>
      <tbody>
        {filas.slice(0, 150).map((r) => (
          <tr key={r.folio} onClick={() => onAbrir(r)}>
            <td style={{ borderLeftColor: "#166534" }}>
              <span className="sv-folio">{r.folio}</span>
            </td>
            <td>{tienda(r)}</td>
            <td>{corto(r.ingeniero_asignado)}</td>
            <td style={{ whiteSpace: "nowrap" }}>{fecha(r.fecha_resuelto)}</td>
            <td style={{ maxWidth: 260, color: "#6b7280" }}>
              <span style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{r.solucion ?? "—"}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TablaGas({ filas, onAbrir }: { filas: Gas[]; onAbrir: (s: Gas) => void }) {
  if (!filas.length) return <div className="sv-vacio">Sin solicitudes de gasolina.</div>;
  return (
    <table className="sv-tabla">
      <thead>
        <tr>
          <th>Ingeniero</th>
          <th>Monto</th>
          <th>Autorizado</th>
          <th>Fecha</th>
          <th>Estado</th>
        </tr>
      </thead>
      <tbody>
        {filas.map((s) => {
          const d = (s.datos ?? {}) as Record<string, unknown>;
          return (
            <tr key={s.id} onClick={() => onAbrir(s)}>
              <td style={{ borderLeftColor: gasEstado(s.estado).color }}>{s.ingeniero}</td>
              <td className="sv-folio">{d.monto != null ? `$${d.monto}` : "—"}</td>
              <td>{d.monto_autorizado != null ? `$${d.monto_autorizado}` : "—"}</td>
              <td style={{ whiteSpace: "nowrap" }}>{fecha(s.created_at)}</td>
              <td>
                <Chip {...gasEstado(s.estado)} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function ListaNotas({ notas, porFolio, onAbrir }: { notas: Nota[]; porFolio: Map<string, Reporte>; onAbrir: (folio: string) => void }) {
  if (!notas.length) return <div className="sv-vacio">Sin notas en folios abiertos.</div>;
  return (
    <table className="sv-tabla">
      <thead>
        <tr>
          <th>Folio</th>
          <th>Nota</th>
          <th>Autor</th>
          <th>Fecha</th>
        </tr>
      </thead>
      <tbody>
        {notas.map((n) => {
          const r = porFolio.get(n.folio);
          return (
            <tr key={n.id} onClick={() => onAbrir(n.folio)}>
              <td style={{ borderLeftColor: "#0f8b8d" }}>
                <span className="sv-folio">{n.folio}</span>
                <span className="sv-sub">{r ? tienda(r) : ""}</span>
              </td>
              <td>{n.texto}</td>
              <td>{n.nombre ?? "—"}</td>
              <td style={{ whiteSpace: "nowrap" }}>{fecha(n.created_at)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/** Lo más reciente de todo: gasolina, notas, cierres y pausas. */
function Actividad({
  datos,
  gasolina,
  porFolio,
  onFolio,
  onGas,
}: {
  datos: DatosPanel;
  gasolina: Gas[];
  porFolio: Map<string, Reporte>;
  onFolio: (folio: string) => void;
  onGas: (s: Gas) => void;
}) {
  type Item = { cuando: string; chip: [string, string, string]; texto: string; sub: string; abrir: () => void };
  const items: Item[] = [
    ...gasolina.slice(0, 10).map((s) => ({
      cuando: s.created_at,
      chip: ["Gasolina", "#faeeda", "#854f0b"] as [string, string, string],
      texto: `${s.ingeniero} · $${(s.datos as Record<string, unknown>)?.monto ?? "—"} · ${gasEstado(s.estado).texto}`,
      sub: "",
      abrir: () => onGas(s),
    })),
    ...datos.notasRecientes.map((n) => ({
      cuando: n.created_at,
      chip: ["Nota", "#e6f4f4", "#0b5f60"] as [string, string, string],
      texto: `${n.nombre ?? "—"}: ${n.texto}`,
      sub: porFolio.get(n.folio)?.cr ?? n.folio,
      abrir: () => onFolio(n.folio),
    })),
    ...datos.cerrados.slice(0, 10).map((r) => ({
      cuando: r.fecha_resuelto ?? r.updated_at,
      chip: ["Cerrado", "#dcfce7", "#166534"] as [string, string, string],
      texto: `${r.folio} · ${r.tienda ?? ""}`,
      sub: corto(r.ingeniero_asignado),
      abrir: () => onFolio(r.folio),
    })),
    ...datos.activos
      .filter((r) => r.pausado_at)
      .map((r) => ({
        cuando: r.pausado_at!,
        chip: ["Pausa", "#fdf0e3", "#9a4a06"] as [string, string, string],
        texto: tienda(r),
        sub: corto(r.ingeniero_asignado),
        abrir: () => onFolio(r.folio),
      })),
  ]
    .filter((i) => i.cuando)
    .sort((a, b) => b.cuando.localeCompare(a.cuando))
    .slice(0, 12);

  return (
    <aside className="sv-feed">
      <h2>Actividad reciente</h2>
      {items.length === 0 && <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>Sin actividad.</p>}
      {items.map((i, k) => (
        <div key={k} className="sv-feed-item" onClick={i.abrir}>
          <Chip texto={i.chip[0]} fondo={i.chip[1]} color={i.chip[2]} />
          <p>{i.texto}</p>
          <small>{[i.sub, hace(i.cuando)].filter(Boolean).join(" · ")}</small>
        </div>
      ))}
    </aside>
  );
}

function hace(iso: string) {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (Number.isNaN(min)) return "";
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.round(h / 24)} d`;
}

const PASOS: [string, keyof Reporte][] = [
  ["Asignado", "fecha_asignacion"],
  ["Confirmado", "fecha_confirmacion"],
  ["En sitio", "fecha_llegada"],
  ["Cerrado", "fecha_resuelto"],
];
const ORDEN = ["Asignado", "Confirmado", "LlegadaSitio", "Resuelto"];

function DetalleFolio({ r, notas, ahora }: { r: Reporte; notas: Nota[]; ahora: number }) {
  const actual = ORDEN.indexOf(estadoGetic(r.estado));
  const coms = (r.comentarios ?? []).filter((c) => c.tipo !== "historia");
  const p = prio(r.prioridad);
  const hora = (v: unknown) => {
    const f = fecha(v);
    return f === "—" ? "" : f.slice(11);
  };
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 20, fontWeight: 650, flex: 1 }} className="sv-folio">
          {r.folio}
        </span>
        {r.pausado_at && <Pausa />}
        {p && <Chip texto={clavePrioridad(r.prioridad) === "critica" ? "Crítica" : r.prioridad!} fondo={p.fondo} color={p.color} />}
      </div>
      <div style={{ fontSize: 14, color: "#6b7280", marginTop: 3 }}>
        {tienda(r)} · {r.ingeniero_asignado ?? "—"}
      </div>

      <div style={{ display: "flex", gap: 4, marginTop: 16 }}>
        {PASOS.map((_, i) => (
          <span key={i} style={{ height: 5, flex: 1, borderRadius: 3, background: i <= actual ? "#f28c28" : "#e5e7eb" }} />
        ))}
      </div>
      <div style={{ display: "flex", marginTop: 5 }}>
        {PASOS.map(([t, campo], i) => (
          <div key={t} style={{ flex: 1, fontSize: 11.5, color: i === actual ? "#f28c28" : "#9ca3af", fontWeight: i === actual ? 600 : 400 }}>
            {t}
            <div style={{ color: "#6b7280", fontWeight: 400 }}>{hora(r[campo])}</div>
          </div>
        ))}
      </div>

      <h3>Datos</h3>
      <div className="sv-datos">
        <div>
          <small>Grupo · concepto</small>
          <span>{[r.grupo_servicio, r.concepto_servicio].filter(Boolean).join(" · ") || "—"}</span>
        </div>
        <div>
          <small>Tiempo</small>
          <span>{estadoGetic(r.estado) === "Resuelto" ? "—" : <Tiempo r={r} ahora={ahora} />}</span>
        </div>
        <div>
          <small>Creación</small>
          <span>{fecha(r.fecha_creacion)}</span>
        </div>
        <div>
          <small>Pausa desde</small>
          <span>{r.pausado_at ? fecha(r.pausado_at) : "—"}</span>
        </div>
      </div>

      {(r.solucion || r.vobo || r.atiende) && (
        <>
          <h3>Cierre</h3>
          <div className="sv-datos">
            <div style={{ gridColumn: "1 / -1" }}>
              <small>Solución</small>
              <span>{r.solucion ?? "—"}</span>
            </div>
            <div>
              <small>VoBo</small>
              <span>{r.vobo ?? "—"}</span>
            </div>
            <div>
              <small>Atiende</small>
              <span>{r.atiende ?? "—"}</span>
            </div>
          </div>
        </>
      )}

      <h3>Notas internas</h3>
      {notas.length === 0 ? (
        <p style={{ fontSize: 13.5, color: "#6b7280", margin: 0 }}>Sin notas.</p>
      ) : (
        notas.map((n) => (
          <div key={n.id} className="sv-nota">
            <b style={{ fontWeight: 600 }}>{n.nombre ?? "—"}:</b> {n.texto}
            <small>{fecha(n.created_at)}</small>
          </div>
        ))
      )}

      {coms.length > 0 && (
        <>
          <h3>Comentarios de Getic</h3>
          {coms.map((c, i) => (
            <div key={i} className="sv-nota">
              <b style={{ fontWeight: 600 }}>{c.usuario ?? "—"}:</b> {c.mensaje}
              <small>{c.fecha}</small>
            </div>
          ))}
        </>
      )}
    </>
  );
}

function DetalleGas({ s }: { s: Gas }) {
  const d = (s.datos ?? {}) as Record<string, unknown>;
  const rechazada = s.estado === "rechazada";
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 20, fontWeight: 650, flex: 1 }}>Gasolina</span>
        <Chip {...gasEstado(s.estado)} />
      </div>
      <div style={{ fontSize: 14, color: "#6b7280", marginTop: 3 }}>{s.ingeniero}</div>
      <h3>Detalle</h3>
      <div className="sv-datos">
        <div>
          <small>Monto solicitado</small>
          <span>{d.monto != null ? `$${d.monto}` : "—"}</span>
        </div>
        <div>
          <small>Monto autorizado</small>
          <span>{d.monto_autorizado != null ? `$${d.monto_autorizado}` : "—"}</span>
        </div>
        <div>
          <small>Kilometraje</small>
          <span>{d.kilometraje != null ? String(d.kilometraje) : "—"}</span>
        </div>
        <div>
          <small>Folio foráneo</small>
          <span>{d.foraneo === true ? "Sí" : "No"}</span>
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <small>{rechazada ? "Motivo de rechazo" : "Mensaje de autorización"}</small>
          <span>{d.motivo_getic != null ? String(d.motivo_getic) : "—"}</span>
        </div>
        <div>
          <small>Fecha de solicitud</small>
          <span>{fecha(s.created_at)}</span>
        </div>
        <div>
          <small>Evidencia enviada</small>
          <span>{fecha(d.evidencia_at)}</span>
        </div>
      </div>
    </>
  );
}

/** Panel deslizable a la derecha (portal a body para quedar sobre todo). */
function Cajon({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);
  if (typeof document === "undefined") return null;
  return createPortal(
    <>
      <div className="sv-velo" onClick={onClose} />
      <div className="sv-cajon" role="dialog" aria-modal="true">
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: -6 }}>
          <button onClick={onClose} aria-label="Cerrar" style={{ border: "none", background: "none", fontSize: 24, color: "#6b7280", cursor: "pointer", lineHeight: 1 }}>
            ×
          </button>
        </div>
        {children}
      </div>
    </>,
    document.body,
  );
}
