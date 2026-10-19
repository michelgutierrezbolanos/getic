import GeticShell from "@/components/GeticShell";
import type { Reporte } from "@/lib/reportes";
import { sesionActual } from "@/lib/sesion";
import Inicio, { type DiaHorario } from "./inicio";

export const dynamic = "force-dynamic";

// Clon de index.php de Getic. Solo los folios tienen función; lo demás es visual.
export default async function Home() {
  const { supabase, user, nombre, puesto, inicio } = await sesionActual();
  const [{ data: reportes }, { data: horario }, { data: vehiculo }] = await Promise.all([
    supabase.from("reportes").select("*"),
    supabase.from("horarios").select("fecha, entrada, comida, salida, descanso").eq("perfil_id", user?.id ?? ""),
    supabase.from("vehiculos").select("placa, numero_economico").eq("perfil_id", user?.id ?? "").maybeSingle(),
  ]);

  return (
    <GeticShell nombre={nombre} puesto={puesto}>
      <main className="jqm-content fade-in">
        <Inicio
          nombre={nombre}
          reportes={(reportes ?? []) as Reporte[]}
          horario={(horario ?? []) as DiaHorario[]}
          vehiculo={vehiculo}
          resumen={inicio}
        />
      </main>
    </GeticShell>
  );
}
