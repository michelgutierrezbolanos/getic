"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { estadoGetic, formatFechaLarga, tiempoEnVivo, urlMapa, type Reporte } from "@/lib/reportes";

type Accion = {
  id: number;
  accion: string;
  estado: "pendiente" | "procesando" | "hecho" | "error";
  error: string | null;
  payload: { texto?: string } | null;
  created_at: string;
};

const NOMBRE_ACCION: Record<string, string> = {
  tomar: "Tomar incidencia",
  confirmar: "Confirmar incidencia",
  llegada: "Marcar llegada a sitio",
  cierre: "Cerrar folio",
  comentario: "Comentario",
};

export default function DetalleFolio({ inicial, miNombre }: { inicial: Reporte; miNombre: string }) {
  const router = useRouter();
  const [r, setR] = useState(inicial);
  const [acciones, setAcciones] = useState<Accion[]>([]);
  const [ahora, setAhora] = useState(() => Date.now());
  const [error, setError] = useState<string | null>(null);

  const cargarAcciones = useCallback(async () => {
    const { data } = await createClient()
      .from("acciones_bot")
      .select("id, accion, estado, error, payload, created_at")
      .eq("folio", inicial.folio)
      .order("created_at", { ascending: false })
      .limit(20);
    setAcciones((data ?? []) as Accion[]);
  }, [inicial.folio]);

  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Reporte y acciones en vivo
  useEffect(() => {
    cargarAcciones();
    const supabase = createClient();
    const canal = supabase
      .channel(`folio-${inicial.folio}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reportes", filter: `folio=eq.${inicial.folio}` },
        (p) => p.new && "folio" in p.new && setR(p.new as Reporte),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "acciones_bot", filter: `folio=eq.${inicial.folio}` },
        () => cargarAcciones(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(canal);
    };
  }, [inicial.folio, cargarAcciones]);

  async function pedir(accion: string, payload: Record<string, unknown> = {}) {
    setError(null);
    const { error } = await createClient().from("acciones_bot").insert({ folio: r.folio, accion, payload });
    if (error) {
      setError(error.message);
      return false;
    }
    await cargarAcciones();
    return true;
  }

  const estado = estadoGetic(r.estado);
  const enCurso = acciones.find((a) => a.accion !== "comentario" && (a.estado === "pendiente" || a.estado === "procesando"));
  const ultimoError = acciones.find((a) => a.accion !== "comentario" && a.estado === "error");
  const tiempo = tiempoEnVivo(r, ahora);

  const filas: [string, React.ReactNode][] = [
    ["Responsable", r.ingeniero_asignado],
    ["ATI", r.ati],
    ["Plaza", r.plaza],
    ["Numero de incidente", r.folio],
    ["Tipo de registro", r.tipo_registro],
    ["Fecha de creacion", formatFechaLarga(r.fecha_creacion)],
    ["Fecha de programacion", formatFechaLarga(r.fecha_programacion)],
    ["Fecha de Transferencia", formatFechaLarga(r.fecha_transferencia)],
    ["Fecha de asignacion", formatFechaLarga(r.fecha_asignacion)],
    ["Fecha de confirmacion", formatFechaLarga(r.fecha_confirmacion)],
    ["Estado", r.estado],
    [
      "CR",
      <a key="cr" href={urlMapa(r)} target="_blank" rel="noopener noreferrer" className="underline">
        {r.cr}
      </a>,
    ],
    ["Tienda", r.tienda],
    ["Prioridad", r.prioridad],
    ["Grupo de servicio", r.grupo_servicio],
    ["Concepto de servicio", r.concepto_servicio],
    ["Reporte de Folio:", <span key="rf" style={{ whiteSpace: "pre-line" }}>{r.reporte_folio}</span>],
    ["Categoria OPV Proveedor:", r.categoria_opv],
    ["Categoria Incidencia:", r.categoria_incidencia],
    [
      "Tiempo restante",
      tiempo && (
        <b key="t" style={{ color: tiempo.vencido ? "#ff0000" : "#000" }}>
          {tiempo.texto}
        </b>
      ),
    ],
  ];

  return (
    <div className="detalle-getic">
      <div className="flex items-center gap-2">
        <button className="btn-icono" title="Recargar" aria-label="Recargar" onClick={() => router.refresh()}>
          ⟳
        </button>
        <Link href="/reportes" className="btn-icono" title="Lista de folios" aria-label="Lista de folios">
          ⌂
        </Link>
      </div>

      <h3 className="seccion-titulo">Informacion de apertura</h3>
      <div className="caja">
        <table className="tabla-apertura">
          <tbody>
            {filas.map(([k, v]) => (
              <tr key={k}>
                <td>
                  <b>{k}</b>
                </td>
                <td>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <UltimasIncidencias historial={r.historial_tienda ?? []} />

      {/* Acción según el estado, como los botones de Getic */}
      <div className="caja mt-4">
        {enCurso ? (
          <p className="estado-accion">
            ⏳ <b>{NOMBRE_ACCION[enCurso.accion] ?? enCurso.accion}</b>: enviando a Getic…
          </p>
        ) : (
          <>
            {ultimoError && (
              <p className="estado-accion error">
                ✕ {NOMBRE_ACCION[ultimoError.accion] ?? ultimoError.accion}: {ultimoError.error}
              </p>
            )}
            {estado === "Sin Asignar" && (
              <BloqueAccion titulo="Tomar incidencia" boton="Tomar Incidencia !" onClick={() => pedir("tomar")} />
            )}
            {estado === "Asignado" && (
              <BloqueAccion titulo="Confirmar incidencia" boton="Confirmar Incidencia !" onClick={() => pedir("confirmar")} />
            )}
            {estado === "Confirmado" && (
              <BloqueAccion
                titulo="Informacion de llegada a sitio"
                boton="Marcar llegada a sitio !"
                onClick={() => pedir("llegada")}
              />
            )}
            {estado === "LlegadaSitio" && <FormCierre reporte={r} miNombre={miNombre} pedir={pedir} setError={setError} />}
            {estado === "Resuelto" && <p className="estado-accion">Folio resuelto.</p>}
          </>
        )}
        {error && <p className="estado-accion error">{error}</p>}
      </div>

      <Comentarios
        comentarios={r.comentarios ?? []}
        pendientes={acciones.filter((a) => a.accion === "comentario" && a.estado !== "hecho")}
        onEnviar={(texto) => pedir("comentario", { texto })}
      />
    </div>
  );
}

function BloqueAccion({ titulo, boton, onClick }: { titulo: string; boton: string; onClick: () => Promise<unknown> }) {
  const [enviando, setEnviando] = useState(false);
  return (
    <div>
      <h3 className="seccion-titulo">{titulo}</h3>
      <button
        className="jqm-btn-b"
        disabled={enviando}
        onClick={async () => {
          if (!confirm(`¿${boton.replace(" !", "")}? El bot lo hará en Getic.`)) return;
          setEnviando(true);
          await onClick();
          setEnviando(false);
        }}
      >
        {enviando ? "Enviando…" : boton}
      </button>
    </div>
  );
}

function FormCierre({
  reporte,
  miNombre,
  pedir,
  setError,
}: {
  reporte: Reporte;
  miNombre: string;
  pedir: (accion: string, payload?: Record<string, unknown>) => Promise<boolean>;
  setError: (e: string | null) => void;
}) {
  const [solucion, setSolucion] = useState("");
  const [folioFalso, setFolioFalso] = useState("");
  const [vobo, setVobo] = useState("");
  const [atiende, setAtiende] = useState(miNombre);
  const [enviando, setEnviando] = useState(false);

  if (reporte.solucion) {
    return (
      <div>
        <h3 className="seccion-titulo">Cierre enviado</h3>
        <p>
          <b>Solución:</b> {reporte.solucion}
          <br />
          <b>VoBo:</b> {reporte.vobo} · <b>Atiende:</b> {reporte.atiende}
        </p>
      </div>
    );
  }

  async function cerrar(e: React.FormEvent) {
    e.preventDefault();
    if (!solucion.trim() || !vobo.trim() || !atiende.trim()) return setError("Solución, VoBo y Atiende son obligatorios");
    if (!confirm(`¿Cerrar ${reporte.folio}? El bot lo cerrará en Getic y mandará el WhatsApp.`)) return;
    setEnviando(true);
    const textoSolucion = folioFalso ? `${folioFalso} ${solucion.trim()}` : solucion.trim();
    const { error } = await createClient()
      .from("reportes")
      .update({ solucion: textoSolucion, folio_falso: folioFalso || null, vobo: vobo.trim(), atiende: atiende.trim() })
      .eq("folio", reporte.folio);
    if (error) {
      setEnviando(false);
      return setError(error.message);
    }
    await pedir("cierre", {
      whatsapp: {
        numero_incidente: reporte.folio,
        cr: reporte.cr,
        tienda: reporte.tienda,
        reporte_folio: reporte.reporte_folio,
        solucion: textoSolucion,
        vobo: vobo.trim(),
        atiende: atiende.trim(),
      },
      folio_falso: folioFalso || null,
      evidencias: [],
    });
    setEnviando(false);
  }

  return (
    <form onSubmit={cerrar}>
      <h3 className="seccion-titulo">Cerrar folio</h3>
      <p className="jqm-label">Solución *</p>
      <textarea className="jqm-input" rows={4} value={solucion} onChange={(e) => setSolucion(e.target.value)} />
      <p className="jqm-label">Folio falso</p>
      <select className="jqm-input" value={folioFalso} onChange={(e) => setFolioFalso(e.target.value)}>
        <option value="">No</option>
        <option value="#NSF">#NSF</option>
        <option value="#FDR">#FDR</option>
      </select>
      <p className="jqm-label">VoBo *</p>
      <input className="jqm-input" value={vobo} onChange={(e) => setVobo(e.target.value)} />
      <p className="jqm-label">Atiende *</p>
      <input className="jqm-input" value={atiende} onChange={(e) => setAtiende(e.target.value)} />
      <button type="submit" className="jqm-btn-b mt-3" disabled={enviando}>
        {enviando ? "Enviando…" : "Cerrar Folio !"}
      </button>
    </form>
  );
}

function UltimasIncidencias({ historial }: { historial: NonNullable<Reporte["historial_tienda"]> }) {
  const [abierta, setAbierta] = useState<string | null>(null);
  return (
    <div className="caja mt-4">
      <h3 className="seccion-titulo">Ultimas Incidencias en Tienda</h3>
      {historial.length === 0 ? (
        <p className="text-sm opacity-60">Sin incidencias anteriores.</p>
      ) : (
        <table className="tabla-ultimas">
          <thead>
            <tr>
              <th>Incidencia</th>
              <th>Tipo</th>
              <th>Concepto</th>
              <th>Nombre</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {historial.map((h) => (
              <FilaHistorial key={h.folio} h={h} abierta={abierta === h.folio} onToggle={() => setAbierta(abierta === h.folio ? null : h.folio)} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function FilaHistorial({
  h,
  abierta,
  onToggle,
}: {
  h: NonNullable<Reporte["historial_tienda"]>[number];
  abierta: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr onClick={onToggle} className="cursor-pointer">
        <td className="underline">{h.folio}</td>
        <td>{h.tipo}</td>
        <td>{h.concepto}</td>
        <td>{h.nombre}</td>
        <td>{h.fecha}</td>
      </tr>
      {abierta && (
        <tr>
          <td colSpan={5}>
            <div className="historial-extra">
              <b>Descripcion:</b>
              <p>{h.descripcion}</p>
              <b>Diagnostico:</b>
              <p>{h.diagnostico}</p>
              <b>Solucion:</b>
              <p style={{ whiteSpace: "pre-wrap" }}>{h.solucion}</p>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function Comentarios({
  comentarios,
  pendientes,
  onEnviar,
}: {
  comentarios: NonNullable<Reporte["comentarios"]>;
  pendientes: Accion[];
  onEnviar: (texto: string) => Promise<boolean>;
}) {
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);

  return (
    <div className="caja mt-4">
      <h3 className="seccion-titulo">Comentarios</h3>
      <ul className="chat">
        {comentarios.length === 0 && pendientes.length === 0 && <i className="text-sm opacity-60">Sin comentarios</i>}
        {comentarios.map((c, i) => (
          <li key={i} className={`chat-item ${c.tipo}`}>
            <div className="burbuja">
              {c.tipo === "otro" && c.usuario && <div className="chat-usuario">{c.usuario}</div>}
              <div>{c.mensaje}</div>
              <div className="chat-fecha">{c.fecha}</div>
            </div>
          </li>
        ))}
        {pendientes.map((p) => (
          <li key={p.id} className="chat-item mio">
            <div className="burbuja">
              <div>{p.payload?.texto}</div>
              <div className="chat-fecha" style={p.estado === "error" ? { color: "#c00" } : undefined}>
                {p.estado === "error" ? `No se envió: ${p.error}` : "Enviando a Getic…"}
              </div>
            </div>
          </li>
        ))}
      </ul>
      <form
        className="chat-input"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!texto.trim()) return;
          setEnviando(true);
          if (await onEnviar(texto.trim())) setTexto("");
          setEnviando(false);
        }}
      >
        <textarea
          rows={2}
          placeholder="Escribe un comentario..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
        <button type="submit" disabled={enviando || !texto.trim()} aria-label="Enviar comentario">
          ➤
        </button>
      </form>
    </div>
  );
}
