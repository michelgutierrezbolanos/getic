"use client";

import dynamic from "next/dynamic";
import type { Reporte } from "@/lib/reportes";

// Leaflet usa `window`: se carga solo en el navegador.
const MapaLeaflet = dynamic(() => import("./MapaLeaflet"), {
  ssr: false,
  loading: () => <div className="sv-vacio">Cargando mapa…</div>,
});

export default function MapaSupervisor({ activos }: { activos: Reporte[] }) {
  const sinUbicacion = activos.filter((r) => r.latitud == null || r.longitud == null).length;
  return (
    <>
      <div className="sv-cabecera">
        <div style={{ flex: 1 }}>
          <h1>Mapa de folios activos</h1>
          <p>
            {activos.length - sinUbicacion} en el mapa
            {sinUbicacion > 0 && ` · ${sinUbicacion} sin ubicación registrada`} · toca un pin para ver el detalle
          </p>
        </div>
      </div>
      <MapaLeaflet activos={activos} />
    </>
  );
}
