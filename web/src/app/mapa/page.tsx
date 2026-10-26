import { redirect } from "next/navigation";
import SupervisorShell from "@/components/SupervisorShell";
import MapaSupervisor from "@/components/MapaSupervisor";
import { sesionActual } from "@/lib/sesion";
import { datosPanel, rolActual } from "@/lib/supervisor";

export const dynamic = "force-dynamic";

export default async function MapaPage() {
  if ((await rolActual()) !== "supervisor") redirect("/");
  const { nombre } = await sesionActual();
  const { activos } = await datosPanel();
  return (
    <SupervisorShell nombre={nombre}>
      <MapaSupervisor activos={activos} />
    </SupervisorShell>
  );
}
