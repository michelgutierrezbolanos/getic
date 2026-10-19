import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import MenuUsuario from "@/components/MenuUsuario";
import { createClient } from "@/lib/supabase/server";
import { formatFechaLarga, type Reporte } from "@/lib/reportes";
import TiempoVivo from "./tiempo-vivo";

export const dynamic = "force-dynamic";

export default async function DetalleReporte({ params }: { params: Promise<{ folio: string }> }) {
  const { folio } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("reportes")
    .select("*")
    .eq("folio", decodeURIComponent(folio))
    .maybeSingle();
  if (!data) notFound();
  const r = data as Reporte;

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
    ["Llegada a sitio", formatFechaLarga(r.fecha_llegada)],
    ["Fecha de resuelto", formatFechaLarga(r.fecha_resuelto)],
    ["Tiempo restante", <TiempoVivo key="t" reporte={r} />],
    ["Estado", r.estado],
    ["CR", r.cr],
    ["Tienda", r.tienda],
    ["Prioridad", r.prioridad],
    ["Grupo de servicio", r.grupo_servicio],
    ["Concepto de servicio", r.concepto_servicio],
    ["Reporte de Folio:", r.reporte_folio],
    ["Categoria OPV Proveedor:", r.categoria_opv],
    ["Categoria Incidencia:", r.categoria_incidencia],
    ["Solucion", r.solucion],
    ["Vobo", r.vobo],
    ["Atiende", r.atiende],
  ];

  return (
    <>
      <Header>
        <MenuUsuario />
      </Header>
      <main className="jqm-content fade-in">
        <Link href="/" className="jqm-btn-small mb-3 inline-block">
          ← Reportes
        </Link>
        <table className="tabla-detalle">
          <tbody>
            {filas.map(([titulo, valor]) => (
              <tr key={titulo}>
                <th>{titulo}</th>
                <td>{valor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </>
  );
}
