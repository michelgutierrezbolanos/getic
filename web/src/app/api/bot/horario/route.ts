import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { botAutorizado, fallo, leerJson, noAutorizado, perfilDestino, perfilPorEmail } from "@/lib/bot";

type Dia = { fecha: string; entrada?: string; comida?: string; salida?: string; descanso?: boolean };

// GET /api/bot/horario?email=...[&desde=2026-10-19&hasta=2026-10-25]
export async function GET(req: NextRequest) {
  if (!botAutorizado(req)) return noAutorizado();
  const params = req.nextUrl.searchParams;
  const perfil = await perfilPorEmail(params.get("email"));
  if (!perfil) return fallo("No existe un usuario con ese email", 404);
  let consulta = createAdminClient().from("horarios").select("*").eq("perfil_id", perfil.id).order("fecha");
  const desde = params.get("desde");
  const hasta = params.get("hasta");
  if (desde) consulta = consulta.gte("fecha", desde);
  if (hasta) consulta = consulta.lte("fecha", hasta);
  const { data, error } = await consulta;
  if (error) return fallo(error.message, 500);
  return NextResponse.json(data);
}

// POST /api/bot/horario
// Body: { "email": "...", "dias": [{ "fecha": "2026-10-19", "entrada": "09:00", "comida": "13:00", "salida": "18:00" },
//                                  { "fecha": "2026-10-25", "descanso": true }] }
export async function POST(req: NextRequest) {
  if (!botAutorizado(req)) return noAutorizado();
  const body = (await leerJson(req)) as { email?: string; dias?: Dia[] } | undefined;
  if (!Array.isArray(body?.dias) || body.dias.length === 0) return fallo("Falta la lista dias");
  const destino = await perfilDestino(body.email);
  if (destino.respuesta) return destino.respuesta;

  const filas = body.dias.map((d) => ({
    perfil_id: destino.perfil.id,
    fecha: d.fecha,
    entrada: d.descanso ? null : (d.entrada ?? null),
    comida: d.descanso ? null : (d.comida ?? null),
    salida: d.descanso ? null : (d.salida ?? null),
    descanso: Boolean(d.descanso),
  }));
  const { error } = await createAdminClient().from("horarios").upsert(filas, { onConflict: "perfil_id,fecha" });
  if (error) return fallo(error.message, 500);
  return NextResponse.json({ ok: true, dias: filas.length });
}
