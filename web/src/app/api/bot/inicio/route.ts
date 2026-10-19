import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { botAutorizado, fallo, leerJson, noAutorizado, perfilPorEmail, perfilRequerido } from "@/lib/bot";

// GET /api/bot/inicio?email=...
export async function GET(req: NextRequest) {
  if (!botAutorizado(req)) return noAutorizado();
  const perfil = await perfilPorEmail(req.nextUrl.searchParams.get("email"));
  if (!perfil) return fallo("No existe un usuario con ese email", 404);
  const { data, error } = await createAdminClient()
    .from("inicio_getic")
    .select("*")
    .eq("perfil_id", perfil.id)
    .maybeSingle();
  if (error) return fallo(error.message, 500);
  return NextResponse.json(data);
}

// POST /api/bot/inicio   Body: { "email": "...", "datos": { dias_sin_siniestros, sla_mes, puesto, folios_al_momento, anuncios } }
export async function POST(req: NextRequest) {
  if (!botAutorizado(req)) return noAutorizado();
  const body = (await leerJson(req)) as { email?: string; datos?: Record<string, unknown> } | undefined;
  if (!body?.datos || typeof body.datos !== "object") return fallo("Falta datos");
  const destino = await perfilRequerido(body.email);
  if (destino.respuesta) return destino.respuesta;
  const { error } = await createAdminClient()
    .from("inicio_getic")
    .upsert(
      { perfil_id: destino.perfil.id, datos: body.datos, updated_at: new Date().toISOString() },
      { onConflict: "perfil_id" },
    );
  if (error) return fallo(error.message, 500);
  return NextResponse.json({ ok: true });
}
