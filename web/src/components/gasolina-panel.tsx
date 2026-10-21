"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type GasSolicitud = {
  ing_id: number;
  ing_monto: number;
  ing_estado: string;
  ing_motivo: string;
  ing_fecha: string;
  ing_hora: string;
  ing_img_poscarga: number;
};
type Tarjeta = { value: string; label: string };
type EstadoGas = { solicitud: GasSolicitud | null; tarjetas: Tarjeta[] };

/** Panel/modal de solicitud de gasolina: mismo flujo que Getic (verde/amarillo/rojo). */
export default function GasolinaPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [uid, setUid] = useState<string | null>(null);
  const [gas, setGas] = useState<EstadoGas>({ solicitud: null, tarjetas: [] });
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Formulario
  const [monto, setMonto] = useState("");
  const [kilometraje, setKilometraje] = useState("");
  const [motivo, setMotivo] = useState("");
  const [foraneo, setForaneo] = useState(false);
  const [tarjeta, setTarjeta] = useState<string>("");
  const tablero = useRef<HTMLInputElement>(null);
  const ruta = useRef<HTMLInputElement>(null);
  const ticket = useRef<HTMLInputElement>(null);

  const cargar = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUid(user.id);
    const { data } = await supabase.from("inicio_getic").select("datos").eq("perfil_id", user.id).maybeSingle();
    const g = ((data?.datos as Record<string, unknown>)?.gas ?? {}) as EstadoGas;
    setGas({ solicitud: g.solicitud ?? null, tarjetas: g.tarjetas ?? [] });
    if ((g.tarjetas ?? []).length === 1) setTarjeta(g.tarjetas[0].value);
  }, []);

  useEffect(() => {
    if (!open) return;
    cargar();
    const supabase = createClient();
    const canal = supabase
      .channel("gas-inicio")
      .on("postgres_changes", { event: "*", schema: "public", table: "inicio_getic" }, () => cargar())
      .subscribe();
    return () => { supabase.removeChannel(canal); };
  }, [open, cargar]);

  if (!open) return null;

  const sol = gas.solicitud;
  const autorizada = sol?.ing_estado === "Autorizado";
  const rechazada = sol?.ing_estado === "Rechazado";
  const enProceso = !!sol && !autorizada && !rechazada;
  const aprobadaSinEvidencia = autorizada && (sol?.ing_img_poscarga ?? 0) === 0;
  const puedeSolicitar = !sol || rechazada || (autorizada && (sol?.ing_img_poscarga ?? 0) === 1);

  async function subirFoto(uidActual: string, file: File, etiqueta: string) {
    const supabase = createClient();
    const path = `gasolina/${uidActual}/${Date.now()}_${etiqueta}.jpg`;
    const { error } = await supabase.storage.from("evidencias").upload(path, file, { contentType: file.type || "image/jpeg" });
    if (error) throw new Error(error.message);
    return path;
  }

  async function enviarSolicitud() {
    setError(null);
    if (!uid) return;
    if (!monto.trim()) return setError("Falta el monto en pesos");
    if (!kilometraje.trim()) return setError("Falta el kilometraje");
    if (!motivo.trim()) return setError("Falta el motivo de solicitud");
    if (gas.tarjetas.length > 0 && !tarjeta) return setError("Elige la tarjeta");
    const fTablero = tablero.current?.files?.[0];
    if (!fTablero) return setError("Falta la foto del tablero");
    const fRuta = ruta.current?.files?.[0];
    if (foraneo && !fRuta) return setError("Para folio foráneo falta la imagen de la ruta");

    setEnviando(true);
    try {
      const supabase = createClient();
      const rutaTablero = await subirFoto(uid, fTablero, "tablero");
      const rutaRuta = foraneo && fRuta ? await subirFoto(uid, fRuta, "ruta") : null;
      const { data: solRow, error: e1 } = await supabase
        .from("solicitudes")
        .insert({ perfil_id: uid, tipo: "gasolina", datos: { monto, kilometraje, motivo, foraneo, tarjeta: tarjeta || null } })
        .select()
        .single();
      if (e1) throw new Error(e1.message);
      const { error: e2 } = await supabase.from("acciones_bot").insert({
        accion: "solicitud",
        payload: {
          solicitud_id: solRow.id,
          tipo: "gasolina",
          monto, kilometraje, motivo, foraneo,
          tarjeta: tarjeta || null,
          foto_tablero: rutaTablero,
          foto_ruta: rutaRuta,
        },
      });
      if (e2) throw new Error(e2.message);
      setMonto(""); setKilometraje(""); setMotivo(""); setForaneo(false);
      if (tablero.current) tablero.current.value = "";
      if (ruta.current) ruta.current.value = "";
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setEnviando(false);
    }
  }

  async function enviarEvidencia() {
    setError(null);
    if (!uid || !sol) return;
    const f = ticket.current?.files?.[0];
    if (!f) return setError("Agrega la foto del ticket");
    setEnviando(true);
    try {
      const supabase = createClient();
      const path = await subirFoto(uid, f, "ticket");
      const { error } = await supabase.from("acciones_bot").insert({
        accion: "evidencia_gas",
        payload: { ing_id: sol.ing_id, foto: path },
      });
      if (error) throw new Error(error.message);
      if (ticket.current) ticket.current.value = "";
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setEnviando(false);
    }
  }

  const colorEstado = autorizada ? "#2e7d32" : rechazada ? "#c62828" : "#b8860b";
  const fondoEstado = autorizada ? "#e6f6e6" : rechazada ? "#fde7e7" : "#fdf3d6";

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#fff", color: "#111", borderRadius: 10, maxWidth: 460, width: "100%", maxHeight: "90vh", overflowY: "auto", padding: 20 }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <b style={{ fontSize: 20 }}>Gasolina</b>
          <button onClick={onClose} aria-label="Cerrar" style={{ fontSize: 22, background: "none", border: "none", cursor: "pointer" }}>×</button>
        </div>

        {sol && (
          <div style={{ border: `2px solid ${colorEstado}`, background: fondoEstado, borderRadius: 10, padding: 14, marginBottom: 14 }}>
            <b style={{ fontSize: 17 }}>
              {autorizada ? "Carga autorizada" : rechazada ? "Solicitud rechazada" : "Solicitud en proceso"}
            </b>
            <div style={{ marginTop: 6 }}>
              {autorizada ? `Monto autorizado: $${sol.ing_monto}` : `Monto solicitado: $${sol.ing_monto}`}
            </div>
            {sol.ing_motivo && (
              <div style={{ marginTop: 4 }}>
                {autorizada ? "Motivo de autorización: " : rechazada ? "Motivo de rechazo: " : "Motivo: "}{sol.ing_motivo}
              </div>
            )}
            {autorizada && <div style={{ marginTop: 6, fontSize: 14 }}>Ya puedes cargar. Recuerda subir la evidencia del ticket.</div>}
            {rechazada && <div style={{ marginTop: 6, fontSize: 14 }}>Puedes volver a solicitar gasolina.</div>}
            {(sol.ing_fecha || sol.ing_hora) && <div style={{ marginTop: 8, opacity: .6, fontSize: 13 }}>{sol.ing_fecha} {sol.ing_hora}</div>}
          </div>
        )}

        {aprobadaSinEvidencia && (
          <div style={{ border: "1px solid #ccc", borderRadius: 10, padding: 14, marginBottom: 14 }}>
            <b>Evidencia de la carga</b>
            <p style={{ fontSize: 13, opacity: .7, margin: "4px 0 10px" }}>
              Foto del ticket junto al tablero, donde se vea el indicador de gasolina y el odómetro.
            </p>
            <input ref={ticket} type="file" accept="image/*" capture="environment" />
            <button className="jqm-btn-b" style={{ marginTop: 10 }} disabled={enviando} onClick={enviarEvidencia}>
              {enviando ? "Enviando…" : "Enviar evidencia"}
            </button>
          </div>
        )}

        {enProceso && (
          <p style={{ color: "#777" }}>
            Tu solicitud está en proceso de autorización. No puedes hacer otra hasta que te la aprueben o rechacen.
          </p>
        )}

        {puedeSolicitar && (
          <div>
            <b style={{ fontSize: 17 }}>Solicitar gasolina</b>
            <Campo label="Monto en pesos *">
              <input type="number" inputMode="numeric" value={monto} onChange={(e) => setMonto(e.target.value)} style={inp} />
            </Campo>
            <Campo label="Kilometraje del vehículo *">
              <input type="number" inputMode="numeric" value={kilometraje} onChange={(e) => setKilometraje(e.target.value)} style={inp} />
            </Campo>
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
              <input type="checkbox" checked={foraneo} onChange={(e) => setForaneo(e.target.checked)} />
              ¿Para atención de folio foráneo?
            </label>
            {foraneo && (
              <Campo label="Imagen de la ruta *">
                <input ref={ruta} type="file" accept="image/*" capture="environment" />
              </Campo>
            )}
            {gas.tarjetas.length === 0 ? (
              <p style={{ color: "#c62828", marginTop: 12 }}>No tienes tarjeta de gasolina vinculada en Getic.</p>
            ) : gas.tarjetas.length === 1 ? (
              <p style={{ marginTop: 12 }}>Tarjeta: {gas.tarjetas[0].label}</p>
            ) : (
              <Campo label="Tarjeta *">
                <select value={tarjeta} onChange={(e) => setTarjeta(e.target.value)} style={inp}>
                  <option value="">Elige la tarjeta</option>
                  {gas.tarjetas.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Campo>
            )}
            <Campo label="Imagen del tablero *">
              <input ref={tablero} type="file" accept="image/*" capture="environment" />
            </Campo>
            <Campo label="Motivo de solicitud *">
              <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={3} style={inp} />
            </Campo>
            {error && <p style={{ color: "#c62828", fontWeight: 700, marginTop: 10 }}>{error}</p>}
            <button className="jqm-btn-b" style={{ marginTop: 16, width: "100%" }} disabled={enviando} onClick={enviarSolicitud}>
              {enviando ? "Enviando…" : "Solicitar"}
            </button>
          </div>
        )}
        {!puedeSolicitar && error && <p style={{ color: "#c62828", fontWeight: 700, marginTop: 10 }}>{error}</p>}
      </div>
    </div>
  );
}

const inp: React.CSSProperties = { width: "100%", padding: 10, border: "2px solid #ccc", borderRadius: 4, boxSizing: "border-box" };

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}
