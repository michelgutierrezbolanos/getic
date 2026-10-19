"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ESTADOS_GETIC,
  colorFila,
  estadoGetic,
  estaCerrado,
  formatFecha,
  ordenarReportes,
  tiempoEnVivo,
  urlMapa,
  type Reporte,
} from "@/lib/reportes";

type Columna = { id: string; titulo: string; celda: (r: Reporte, ahora: number) => React.ReactNode };

function DosLineas({ arriba, abajo }: { arriba: React.ReactNode; abajo?: React.ReactNode }) {
  return (
    <div className="dos-lineas">
      <div>{arriba}</div>
      {abajo !== undefined && <div>{abajo}</div>}
    </div>
  );
}

function Fecha({ iso }: { iso: string | null }) {
  const f = formatFecha(iso);
  if (!f) return null;
  return (
    <span className="whitespace-nowrap">
      {f[0]}
      <br />
      {f[1]}
    </span>
  );
}

const COLUMNAS: Columna[] = [
  {
    id: "folio",
    titulo: "N° Folio",
    celda: (r) => (
      <Link href={`/reportes/${encodeURIComponent(r.folio)}`} className="link-fuerte">
        {r.folio}
      </Link>
    ),
  },
  {
    id: "tienda",
    titulo: "CR/ Nombre Tienda",
    celda: (r) => (
      <DosLineas
        arriba={<b>{r.cliente}</b>}
        abajo={
          <a href={urlMapa(r)} target="_blank" rel="noopener noreferrer" className="link-tienda">
            {[r.cr, r.tienda].filter(Boolean).join(" - ")}
          </a>
        }
      />
    ),
  },
  {
    id: "grupo",
    titulo: "Grupo - Concepto Servicio",
    celda: (r) => (
      <DosLineas
        arriba={[r.grupo_servicio, r.concepto_servicio].filter(Boolean).join(" - ")}
        abajo={r.categoria_opv}
      />
    ),
  },
  { id: "ingeniero", titulo: "Ingeniero Asignado", celda: (r) => r.ingeniero_asignado },
  { id: "ati", titulo: "ATI", celda: (r) => r.ati },
  { id: "prioridad", titulo: "Prioridad", celda: (r) => r.prioridad },
  { id: "alta", titulo: "Hora Alta", celda: (r) => <Fecha iso={r.fecha_creacion} /> },
  { id: "asignada", titulo: "Hora Asignada", celda: (r) => <Fecha iso={r.fecha_asignacion} /> },
  { id: "llegada", titulo: "Llegada a sitio", celda: (r) => <Fecha iso={r.fecha_llegada} /> },
  { id: "resuelto", titulo: "Fecha de resuelto", celda: (r) => <Fecha iso={r.fecha_resuelto} /> },
  {
    id: "tiempo",
    titulo: "Tiempo Restante",
    celda: (r, ahora) => {
      const t = tiempoEnVivo(r, ahora);
      if (!t) return null;
      return (
        <h3 className="tiempo" style={{ color: t.vencido ? "#ff0000" : "#000" }}>
          {t.texto}
        </h3>
      );
    },
  },
];

const CLAVE_COLUMNAS = "getic_columnas_ocultas";

export default function TablaReportes({ iniciales }: { iniciales: Reporte[] }) {
  const router = useRouter();
  const [reportes, setReportes] = useState(iniciales);
  const [busqueda, setBusqueda] = useState("");
  const [ocultas, setOcultas] = useState<string[]>([]);
  const [menuColumnas, setMenuColumnas] = useState(false);
  const [ahora, setAhora] = useState(() => Date.now());

  // Reloj para el tiempo restante
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Columnas ocultas recordadas por navegador
  useEffect(() => {
    try {
      const guardado = localStorage.getItem(CLAVE_COLUMNAS);
      if (guardado) setOcultas(JSON.parse(guardado));
    } catch {}
  }, []);

  function alternarColumna(id: string) {
    setOcultas((prev) => {
      const nuevo = prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id];
      try {
        localStorage.setItem(CLAVE_COLUMNAS, JSON.stringify(nuevo));
      } catch {}
      return nuevo;
    });
  }

  // Cambios en vivo cuando el bot inserta o actualiza
  useEffect(() => {
    const supabase = createClient();
    const canal = supabase
      .channel("reportes-tabla")
      .on("postgres_changes", { event: "*", schema: "public", table: "reportes" }, (payload) => {
        setReportes((prev) => {
          if (payload.eventType === "DELETE") {
            const folio = (payload.old as Partial<Reporte>).folio;
            return prev.filter((r) => r.folio !== folio);
          }
          const nuevo = payload.new as Reporte;
          return [...prev.filter((r) => r.folio !== nuevo.folio), nuevo];
        });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(canal);
    };
  }, []);

  const activos = useMemo(() => reportes.filter((r) => !estaCerrado(r.estado)), [reportes]);

  const conteo = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of activos) c[estadoGetic(r.estado)] = (c[estadoGetic(r.estado)] ?? 0) + 1;
    return c;
  }, [activos]);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const filtrados = activos.filter((r) =>
      !q
        ? true
        : [r.folio, r.cr, r.tienda, r.ingeniero_asignado, r.grupo_servicio, r.concepto_servicio, r.prioridad, r.estado]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(q)),
    );
    return ordenarReportes(filtrados);
  }, [activos, busqueda]);

  const plaza = reportes.find((r) => r.plaza)?.plaza ?? "OPV-Prov Vallarta";
  const columnas = COLUMNAS.filter((c) => !ocultas.includes(c.id));

  return (
    <div>
      <div className="flex items-center justify-between">
        <button className="btn-icono" title="Recargar" aria-label="Recargar" onClick={() => router.refresh()}>
          ⟳
        </button>
        <button className="btn-icono" title="Regresar" aria-label="Regresar" onClick={() => router.back()}>
          ↶
        </button>
      </div>

      <h2 className="titulo-reporte">Reporte de Incidencias : {plaza}</h2>

      <table className="leyenda">
        <tbody>
          {ESTADOS_GETIC.map(({ estado, color }) => (
            <tr key={estado}>
              <td>{estado}</td>
              <td className="leyenda-num" style={{ backgroundColor: color }}>
                {conteo[estado] ?? 0}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="my-3 flex items-center gap-2">
        <div className="buscador">
          <span aria-hidden>⌕</span>
          <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} aria-label="Buscar" />
        </div>
        <div className="relative ml-auto">
          <button className="btn-negro" onClick={() => setMenuColumnas((v) => !v)}>
            Columnas
          </button>
          {menuColumnas && (
            <div className="menu-columnas">
              {COLUMNAS.map((c) => (
                <label key={c.id} className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    checked={!ocultas.includes(c.id)}
                    onChange={() => alternarColumna(c.id)}
                  />
                  {c.titulo}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="tabla-contenedor">
        <table className="tabla-getic">
          <thead>
            <tr>
              {columnas.map((c) => (
                <th key={c.id}>{c.titulo}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibles.length === 0 && (
              <tr>
                <td colSpan={columnas.length} className="py-8 text-center font-normal">
                  {activos.length === 0 ? "Sin folios en proceso." : "Ningún folio coincide con la búsqueda."}
                </td>
              </tr>
            )}
            {visibles.map((r) => (
              <tr key={r.folio} style={{ background: colorFila(r.estado) }}>
                {columnas.map((c) => (
                  <td key={c.id}>{c.celda(r, ahora)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
