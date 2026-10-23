import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { estaCerrado, estadoGetic, tiempoEnVivo, type Reporte } from "@/lib/reportes";

export type Solicitud = {
  id: number;
  perfil_id: string;
  tipo: string;
  estado: string;
  datos: Record<string, unknown>;
  created_at: string;
};

export type IngenieroPanel = {
  id: string;
  nombre: string;
  tomados: number;
  confirmados: number;
  enSitio: number;
  pausa: number;
  activos: number;
};

export type GasIngeniero = { id: string; nombre: string; actual: Solicitud | null; historial: Solicitud[] };

export type Nota = { id: number; folio: string; nombre: string | null; texto: string; created_at: string };

export type DatosPanel = {
  ingenieros: IngenieroPanel[];
  resumen: { activos: number; pausa: number; vencidos: number; gasPendiente: number };
  gasolina: GasIngeniero[];
  activos: Reporte[];
  cerrados: Reporte[];
  notasPorFolio: Record<string, Nota[]>;
  notasRecientes: Nota[];
};

const norm = (s: string | null | undefined) => (s ?? "").toLowerCase().replace(/\s+/g, " ").trim();

/** ¿El folio es de este ingeniero? (coincidencia flexible por nombre, como en la app). */
function mismoIngeniero(reporteNombre: string | null, perfilNombre: string) {
  const a = norm(reporteNombre);
  const b = norm(perfilNombre);
  if (!a || !b) return false;
  return a === b || a.startsWith(b) || b.startsWith(a);
}

export type DiaHorario = { entrada: string | null; comida: string | null; salida: string | null; descanso: boolean };
export type HorarioIngeniero = { id: string; nombre: string; dias: Record<string, DiaHorario> };

function isoFecha(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}
/** Lunes a domingo de la semana actual (hora del centro), como ISO yyyy-mm-dd. */
function semanaActual(): string[] {
  const centro = new Date(Date.now() - 6 * 3600 * 1000);
  const dow = (centro.getUTCDay() + 6) % 7; // 0 = lunes
  const lunes = new Date(centro.getTime() - dow * 86400000);
  return Array.from({ length: 7 }, (_, i) => isoFecha(new Date(lunes.getTime() + i * 86400000)));
}

/** Horarios de la semana de cada ingeniero (Vallarta) para el panel. */
export async function datosHorarios(): Promise<{ semana: string[]; ingenieros: HorarioIngeniero[] }> {
  const admin = createAdminClient();
  const semana = semanaActual();
  const [{ data: perfs }, { data: hors }] = await Promise.all([
    admin.from("perfiles").select("id, nombre, rol"),
    admin
      .from("horarios")
      .select("perfil_id, fecha, entrada, comida, salida, descanso")
      .gte("fecha", semana[0])
      .lte("fecha", semana[6]),
  ]);
  const horas = (hors ?? []) as (DiaHorario & { perfil_id: string; fecha: string })[];
  const ingenieros = ((perfs ?? []) as { id: string; nombre: string; rol: string }[])
    .filter((p) => p.rol === "ingeniero")
    .map((p) => {
      const dias: Record<string, DiaHorario> = {};
      for (const h of horas.filter((x) => x.perfil_id === p.id)) {
        dias[h.fecha] = { entrada: h.entrada, comida: h.comida, salida: h.salida, descanso: h.descanso };
      }
      return { id: p.id, nombre: p.nombre, dias };
    });
  return { semana, ingenieros };
}

/** Rol del usuario logueado (para proteger el panel). */
export async function rolActual(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("perfiles").select("rol").eq("id", user.id).maybeSingle();
  return (data?.rol as string | undefined) ?? null;
}

/** Toda la información que muestra el panel (leída con el cliente admin). */
export async function datosPanel(): Promise<DatosPanel> {
  const admin = createAdminClient();
  const [{ data: reps }, { data: sols }, { data: perfs }, { data: nots }] = await Promise.all([
    admin.from("reportes").select("*"),
    admin
      .from("solicitudes")
      .select("id, perfil_id, tipo, estado, datos, created_at")
      .eq("tipo", "gasolina")
      .order("created_at", { ascending: false }),
    admin.from("perfiles").select("id, nombre, rol"),
    admin.from("notas_internas").select("id, folio, nombre, texto, created_at").order("created_at", { ascending: false }),
  ]);

  const reportes = (reps ?? []) as Reporte[];
  const solicitudes = (sols ?? []) as Solicitud[];
  const notas = (nots ?? []) as Nota[];
  const ingenierosPerf = ((perfs ?? []) as { id: string; nombre: string; rol: string }[]).filter(
    (p) => p.rol === "ingeniero",
  );
  const ahora = Date.now();

  const activos = reportes.filter((r) => !estaCerrado(r.estado));
  const cerrados = reportes
    .filter((r) => estaCerrado(r.estado))
    .sort((a, b) => (b.fecha_resuelto ?? b.updated_at ?? "").localeCompare(a.fecha_resuelto ?? a.updated_at ?? ""));

  const ingenieros: IngenieroPanel[] = ingenierosPerf.map((p) => {
    const mios = activos.filter((r) => mismoIngeniero(r.ingeniero_asignado, p.nombre));
    const cnt = (e: string) => mios.filter((r) => estadoGetic(r.estado) === e).length;
    return {
      id: p.id,
      nombre: p.nombre,
      tomados: cnt("Asignado"),
      confirmados: cnt("Confirmado"),
      enSitio: cnt("LlegadaSitio"),
      pausa: mios.filter((r) => r.pausado_at).length,
      activos: mios.length,
    };
  });

  const resumen = {
    activos: activos.length,
    pausa: activos.filter((r) => r.pausado_at).length,
    vencidos: activos.filter((r) => tiempoEnVivo(r, ahora)?.vencido).length,
    gasPendiente: solicitudes.filter((s) => s.estado === "enviada" || s.estado === "autorizada").length,
  };

  const gasolina: GasIngeniero[] = ingenierosPerf
    .map((p) => {
      const suyas = solicitudes.filter((s) => s.perfil_id === p.id); // ya vienen de la más reciente a la más vieja
      return { id: p.id, nombre: p.nombre, actual: suyas[0] ?? null, historial: suyas.slice(1) };
    })
    .filter((g) => g.actual || g.historial.length);

  // Activos para mostrar: primero los en pausa, luego por estado.
  const rangoActivo = (r: Reporte) =>
    r.pausado_at ? 0 : ({ Asignado: 1, Confirmado: 2, LlegadaSitio: 3 } as Record<string, number>)[estadoGetic(r.estado)] ?? 4;
  const activosOrdenados = [...activos].sort(
    (a, b) => rangoActivo(a) - rangoActivo(b) || (a.ingeniero_asignado ?? "").localeCompare(b.ingeniero_asignado ?? ""),
  );

  const notasPorFolio: Record<string, Nota[]> = {};
  for (const n of notas) (notasPorFolio[n.folio] ??= []).push(n); // ya vienen de la más reciente a la más vieja
  for (const folio in notasPorFolio) notasPorFolio[folio].reverse(); // en el detalle, cronológicas
  const notasRecientes = notas.slice(0, 15);

  return { ingenieros, resumen, gasolina, activos: activosOrdenados, cerrados, notasPorFolio, notasRecientes };
}
