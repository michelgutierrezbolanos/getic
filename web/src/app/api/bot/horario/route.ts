import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { botAutorizado, leerJson, noAutorizado, perfilPorEmail } from "@/lib/bot";

type Dia = { fecha: string; entrada?: string; comida?: string; salida?: string; descanso?: boolean };

// POST /api/bot/horario
// Body: { "email": "michel...@getic.com.mx",
//         "dias": [{ "fecha": "2026-10-19", "entrada": "09:00", "comida": "13:00", "salida": "18:00" },
//                  { "fecha": "2026-10-25", "descanso": true }] }
export async function POST(req: NextRequest) {
  if (!botAutorizado(req)) return noAutorizado();
  const body = (await leerJson(req)) as { email?: string; dias?: Dia[] } | undefined;
  const perfil = await perfilPorEmail(body?.email);
  if (!perfil) return NextResponse.json({ error: "No existe un perfil con ese email" }, { status: 404 });
  if (!Array.isArray(body?.dias) || body.dias.length === 0) {
    return NextResponse.json({ error: "Falta la lista dias" }, { status: 400 });
  }

  const filas = body.dias.map((d) => ({
    perfil_id: perfil.id,
    fecha: d.fecha,
    entrada: d.descanso ? null : (d.entrada ?? null),
    comida: d.descanso ? null : (d.comida ?? null),
    salida: d.descanso ? null : (d.salida ?? null),
    descanso: Boolean(d.descanso),
  }));
  const { error } = await createAdminClient()
    .from("horarios")
    .upsert(filas, { onConflict: "perfil_id,fecha" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, dias: filas.length });
}
