import GeticShell from "@/components/GeticShell";
import SupervisorShell from "@/components/SupervisorShell";
import PanelSupervisor from "@/components/PanelSupervisor";
import type { Reporte } from "@/lib/reportes";
import { sesionActual } from "@/lib/sesion";
import { datosPanel, rolActual } from "@/lib/supervisor";
import Inicio, { type DiaHorario } from "./inicio";

export const dynamic = "force-dynamic";

// El supervisor ve el panel; los demás (ingenieros) el clon de Getic.
export default async function Home() {
  const { supabase, user, nombre, puesto, inicio } = await sesionActual();

  if ((await rolActual()) === "supervisor") {
    const datos = await datosPanel();
    return (
      <SupervisorShell nombre={nombre}>
        <main className="jqm-content fade-in">
          <PanelSupervisor datos={datos} />
        </main>
      </SupervisorShell>
    );
  }
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
