import { notFound } from "next/navigation";
import GeticShell from "@/components/GeticShell";
import type { Reporte } from "@/lib/reportes";
import { sesionActual } from "@/lib/sesion";
import DetalleFolio from "./detalle-folio";

export const dynamic = "force-dynamic";

export default async function DetalleReporte({ params }: { params: Promise<{ folio: string }> }) {
  const { folio } = await params;
  const { supabase, nombre, puesto } = await sesionActual();
  const { data } = await supabase.from("reportes").select("*").eq("folio", decodeURIComponent(folio)).maybeSingle();
  if (!data) notFound();

  return (
    <GeticShell nombre={nombre} puesto={puesto}>
      <main className="jqm-content fade-in">
        <DetalleFolio inicial={data as Reporte} miNombre={nombre} />
      </main>
    </GeticShell>
  );
}
