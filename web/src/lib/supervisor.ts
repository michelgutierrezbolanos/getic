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
  masCercano: { tienda: string; km: number } | null;
  ubicadoHaceMin: number | null;
};

type Ubicacion = { perfil_id: string; latitud: number; longitud: number; actualizada_at: string };

/** Distancia en km entre dos coordenadas (Haversine). */
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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
  const [{ data: reps }, { data: sols }, { data: perfs }, { data: nots }, { data: ubis }] = await Promise.all([
    admin.from("reportes").select("*"),
    admin
      .from("solicitudes")
      .select("id, perfil_id, tipo, estado, datos, created_at")
      .eq("tipo", "gasolina")
      .order("created_at", { ascending: false }),
    admin.from("perfiles").select("id, nombre, rol"),
    admin.from("notas_internas").select("id, folio, nombre, texto, created_at").order("created_at", { ascending: false }),
    admin.from("ubicaciones").select("perfil_id, latitud, longitud, actualizada_at"),
  ]);

  const reportes = (reps ?? []) as Reporte[];
  const solicitudes = (sols ?? []) as Solicitud[];
  const notas = (nots ?? []) as Nota[];
  const ubicaciones = (ubis ?? []) as Ubicacion[];
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

    // Folio más cercano de los suyos, según su última ubicación.
    const ub = ubicaciones.find((u) => u.perfil_id === p.id);
    let masCercano: { tienda: string; km: number } | null = null;
    let ubicadoHaceMin: number | null = null;
    if (ub) {
      ubicadoHaceMin = Math.round((ahora - new Date(ub.actualizada_at).getTime()) / 60000);
      let min = Infinity;
      let mejor: Reporte | null = null;
      for (const r of mios) {
        if (r.latitud == null || r.longitud == null) continue;
        const km = haversineKm(ub.latitud, ub.longitud, r.latitud, r.longitud);
        if (km < min) {
          min = km;
          mejor = r;
        }
      }
      if (mejor) masCercano = { tienda: `${mejor.cr ?? ""} - ${mejor.tienda ?? ""}`.trim(), km: Math.round(min * 10) / 10 };
    }

    return {
      id: p.id,
      nombre: p.nombre,
      tomados: cnt("Asignado"),
      confirmados: cnt("Confirmado"),
      enSitio: cnt("LlegadaSitio"),
      pausa: mios.filter((r) => r.pausado_at).length,
      activos: mios.length,
      masCercano,
      ubicadoHaceMin,
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
