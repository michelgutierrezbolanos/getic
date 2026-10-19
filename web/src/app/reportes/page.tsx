import GeticShell from "@/components/GeticShell";
import type { Reporte } from "@/lib/reportes";
import { sesionActual } from "@/lib/sesion";
import TablaReportes from "../tabla-reportes";

export const dynamic = "force-dynamic";

// Clon de pag.reportes.des.php (Reporte de Incidencias de la plaza)
export default async function Reportes({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const { supabase, nombre, puesto } = await sesionActual();
  const { data, error } = await supabase.from("reportes").select("*");

  return (
    <GeticShell nombre={nombre} puesto={puesto}>
      <main className="jqm-content fade-in">
        {error ? (
          <p className="font-bold" style={{ color: "var(--error)" }}>
            No se pudieron cargar los reportes: {error.message}
          </p>
        ) : (
          <TablaReportes iniciales={(data ?? []) as Reporte[]} busquedaInicial={q ?? ""} />
        )}
      </main>
    </GeticShell>
  );
}
