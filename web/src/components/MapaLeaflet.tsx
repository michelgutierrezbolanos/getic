"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState } from "react";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import { estadoGetic, tiempoEnVivo, type Reporte } from "@/lib/reportes";

const FRANJA: Record<string, string> = { alta: "#e53935", media: "#f28c28", baja: "#0f8b8d" };
const ESTADO: Record<string, string> = { Asignado: "Asignado", Confirmado: "Confirmado", LlegadaSitio: "En sitio", "Sin Asignar": "Sin asignar" };
const VALLARTA: [number, number] = [20.6534, -105.2253];

function tiempo(r: Reporte, ahora: number) {
  const t = tiempoEnVivo(r, ahora);
  if (!t) return null;
  if (t.vencido) return { vencido: true, texto: "Vencido" };
  const m = t.texto.match(/(?:(\d+)dia\(s\) )?(\d+):(\d{2})/);
  return { vencido: false, texto: m ? (m[1] ? `${m[1]}d ${m[2]}h` : `${m[2]}h${m[3]}m`) : t.texto };
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** Pin: etiqueta (CR · tienda, tiempo/vencido, pausa) y punto del color de la prioridad. */
function icono(r: Reporte, ahora: number, sel: boolean) {
  const t = tiempo(r, ahora);
  const color = FRANJA[(r.prioridad ?? "").toLowerCase()] ?? "#6b7280";
  const linea2 = [
    t ? (t.vencido ? `<span style="background:#fcebeb;color:#a32d2d;border-radius:4px;padding:0 4px">Vencido</span>` : `🕐 ${t.texto}`) : "",
    r.pausado_at ? `<span style="background:#fdf0e3;color:#9a4a06;border-radius:4px;padding:0 4px">⏸ Pausa</span>` : "",
  ].join(" ");
  return L.divIcon({
    className: "",
    iconSize: [170, 64],
    iconAnchor: [85, 62],
    html: `<div style="display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:64px;font-family:system-ui,sans-serif">
      <div style="background:#fff;border:${sel ? "2px solid #111827" : "1px solid #e5e7eb"};border-radius:8px;padding:3px 7px;box-shadow:0 1px 4px rgba(0,0,0,.18);text-align:center;max-width:170px">
        <div style="font-size:11.5px;font-weight:600;color:#111827;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc([r.cr, r.tienda].filter(Boolean).join(" · "))}</div>
        <div style="font-size:10px;color:#6b7280;white-space:nowrap">${linea2}</div>
      </div>
      <div style="width:${sel ? 20 : 16}px;height:${sel ? 20 : 16}px;margin-top:2px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>
    </div>`,
  });
}

export default function MapaLeaflet({ activos }: { activos: Reporte[] }) {
  const [sel, setSel] = useState<string | null>(null);
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const con = activos.filter((r) => r.latitud != null && r.longitud != null);
  const r = con.find((x) => x.folio === sel);
  const t = r ? tiempo(r, ahora) : null;

  return (
    <div style={{ position: "relative", height: "calc(100vh - 150px)", minHeight: 420, borderRadius: 14, overflow: "hidden" }}>
      <MapContainer center={VALLARTA} zoom={12} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
        <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
        {con.map((x) => (
          <Marker
            key={x.folio}
            position={[x.latitud!, x.longitud!]}
            icon={icono(x, ahora, x.folio === sel)}
            eventHandlers={{ click: () => setSel(x.folio) }}
            zIndexOffset={x.folio === sel ? 1000 : 0}
          />
        ))}
      </MapContainer>

      {r && (
        <div
          style={{
            position: "absolute", right: 14, bottom: 14, width: 320, zIndex: 500, background: "#fff", borderRadius: 14,
            padding: 14, boxShadow: "0 6px 24px rgba(0,0,0,.18)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <b style={{ flex: 1, fontSize: 15 }}>{[r.cr, r.tienda].filter(Boolean).join(" - ")}</b>
            <button onClick={() => setSel(null)} aria-label="Cerrar" style={{ border: "none", background: "none", fontSize: 20, color: "#6b7280", cursor: "pointer" }}>
              ×
            </button>
          </div>
          <div style={{ fontSize: 12.5, color: "#6b7280", marginTop: 2 }}>
            {r.folio} · {[r.grupo_servicio, r.concepto_servicio].filter(Boolean).join(" · ")}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
            {r.prioridad && <span className="sv-chip" style={{ background: "#f3f4f6", color: FRANJA[r.prioridad.toLowerCase()] ?? "#374151" }}>{r.prioridad}</span>}
            <span className="sv-chip" style={{ background: "#e6f4f4", color: "#0b5f60" }}>{ESTADO[estadoGetic(r.estado)] ?? r.estado}</span>
            {r.pausado_at && <span className="sv-chip" style={{ background: "#fdf0e3", color: "#9a4a06" }}>⏸ Pausa</span>}
            {t && (
              <span className="sv-chip" style={t.vencido ? { background: "#fcebeb", color: "#a32d2d" } : { background: "#fff7ed", color: "#c2410c" }}>
                {t.vencido ? "Vencido" : `Faltan ${t.texto}`}
              </span>
            )}
          </div>
          <div style={{ fontSize: 13, marginTop: 8 }}>
            Ingeniero: <b style={{ fontWeight: 600 }}>{r.ingeniero_asignado ?? "—"}</b>
          </div>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${r.latitud},${r.longitud}`}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "block", marginTop: 10, textAlign: "center", background: "#111827", color: "#fff", borderRadius: 10,
              padding: "9px 0", fontSize: 13.5, fontWeight: 600, textDecoration: "none",
            }}
          >
            Abrir en Google Maps
          </a>
        </div>
      )}
    </div>
  );
}
