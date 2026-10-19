"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/client";
import { normalizarReporte, parseTiempo } from "@/lib/reportes";

type Campo = {
  id: string;
  titulo: string;
  tipo?: "text" | "datetime" | "select" | "textarea";
  opciones?: string[];
  placeholder?: string;
};

const CAMPOS: Campo[] = [
  { id: "folio", titulo: "Numero de incidente *", placeholder: "INC14911536" },
  { id: "plaza", titulo: "Plaza", placeholder: "OPV-Prov Vallarta" },
  { id: "cliente", titulo: "Cliente", placeholder: "OXXO MX" },
  { id: "cr", titulo: "CR", placeholder: "50YYB" },
  { id: "tienda", titulo: "Tienda", placeholder: "Guayabitos PVA" },
  { id: "tipo_registro", titulo: "Tipo de registro", placeholder: "Incidencia" },
  { id: "prioridad", titulo: "Prioridad", tipo: "select", opciones: ["", "Alta", "Media", "Baja"] },
  {
    id: "estado",
    titulo: "Estado",
    tipo: "select",
    opciones: ["", "Asignado", "Confirmado", "En sitio", "Resuelto", "Cerrado"],
  },
  { id: "grupo_servicio", titulo: "Grupo de servicio", placeholder: "CCTV" },
  { id: "concepto_servicio", titulo: "Concepto de servicio", placeholder: "Camara" },
  { id: "categoria_opv", titulo: "Categoria OPV Proveedor", placeholder: "OPV CCTV-HARDWARE" },
  { id: "categoria_incidencia", titulo: "Categoria Incidencia", placeholder: "OPV CCTV-HARDWARE" },
  { id: "reporte_folio", titulo: "Reporte de Folio", tipo: "textarea" },
  { id: "ingeniero_asignado", titulo: "Ingeniero asignado" },
  { id: "ati", titulo: "ATI" },
  { id: "fecha_creacion", titulo: "Hora alta", tipo: "datetime" },
  { id: "fecha_asignacion", titulo: "Hora asignada", tipo: "datetime" },
  { id: "fecha_confirmacion", titulo: "Fecha de confirmacion", tipo: "datetime" },
  { id: "fecha_llegada", titulo: "Llegada a sitio", tipo: "datetime" },
  { id: "tiempo_restante", titulo: "Tiempo restante", placeholder: "1dia(s) 21:20:24" },
];

export default function NuevoReporte() {
  const router = useRouter();
  const [valores, setValores] = useState<Record<string, string>>({});
  const [vencido, setVencido] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const set = (id: string, v: string) => setValores((p) => ({ ...p, [id]: v }));

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!valores.folio?.trim()) return setError("El número de incidente es obligatorio");
    if (valores.tiempo_restante && parseTiempo(valores.tiempo_restante) == null) {
      return setError('Tiempo restante debe verse como "15:59:36" o "1dia(s) 21:20:24"');
    }

    // datetime-local no trae zona: se toma como hora del centro
    const entrada: Record<string, unknown> = { ...valores, tiempo_vencido: vencido };
    for (const c of CAMPOS) {
      if (c.tipo === "datetime" && valores[c.id]) entrada[c.id] = `${valores[c.id]}:00-06:00`;
    }

    setGuardando(true);
    const { error } = await createClient()
      .from("reportes")
      .upsert(normalizarReporte(entrada), { onConflict: "folio" });
    setGuardando(false);
    if (error) return setError(error.message);
    router.push(`/reportes/${encodeURIComponent(valores.folio.trim())}`);
    router.refresh();
  }

  return (
    <>
      <Header />
      <main className="jqm-content fade-in">
        <div className="mx-auto max-w-[800px]">
          <Link href="/" className="jqm-btn-small mb-3 inline-block">
            ← Reportes
          </Link>
          <h1 className="text-lg font-bold">Nuevo reporte</h1>
          <p className="text-sm opacity-70">
            Si el número de incidente ya existe, se actualizan sus datos.
          </p>
          <form onSubmit={guardar}>
            {CAMPOS.map((c) => (
              <div key={c.id}>
                <p className="jqm-label">{c.titulo}</p>
                {c.tipo === "select" ? (
                  <select
                    className="jqm-input"
                    value={valores[c.id] ?? ""}
                    onChange={(e) => set(c.id, e.target.value)}
                  >
                    {c.opciones!.map((o) => (
                      <option key={o} value={o}>
                        {o || "—"}
                      </option>
                    ))}
                  </select>
                ) : c.tipo === "textarea" ? (
                  <textarea
                    className="jqm-input"
                    rows={3}
                    value={valores[c.id] ?? ""}
                    onChange={(e) => set(c.id, e.target.value)}
                  />
                ) : (
                  <input
                    className="jqm-input"
                    type={c.tipo === "datetime" ? "datetime-local" : "text"}
                    placeholder={c.placeholder}
                    value={valores[c.id] ?? ""}
                    onChange={(e) => set(c.id, e.target.value)}
                  />
                )}
              </div>
            ))}
            <label className="jqm-check mt-2">
              <input type="checkbox" checked={vencido} onChange={(e) => setVencido(e.target.checked)} />
              Tiempo vencido (en rojo)
            </label>
            {error && (
              <p className="my-2 text-sm font-bold" style={{ color: "var(--error)" }}>
                {error}
              </p>
            )}
            <button type="submit" className="jqm-btn-b" disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar"}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
