import { redirect } from "next/navigation";
import SupervisorShell from "@/components/SupervisorShell";
import HorariosSupervisor from "@/components/HorariosSupervisor";
import { sesionActual } from "@/lib/sesion";
import { datosHorarios, rolActual } from "@/lib/supervisor";

export const dynamic = "force-dynamic";

export default async function HorariosPage() {
  if ((await rolActual()) !== "supervisor") redirect("/");
  const { nombre } = await sesionActual();
  const datos = await datosHorarios();
  return (
    <SupervisorShell nombre={nombre}>
      <main className="jqm-content fade-in">
        <HorariosSupervisor semana={datos.semana} ingenieros={datos.ingenieros} />
      </main>
    </SupervisorShell>
  );
}
