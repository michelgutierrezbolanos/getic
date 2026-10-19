import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { botAutorizado, fallo, leerJson, noAutorizado, perfilPorEmail, perfilRequerido } from "@/lib/bot";

// GET /api/bot/solicitudes[?estado=pendiente][&email=...]
export async function GET(req: NextRequest) {
  if (!botAutorizado(req)) return noAutorizado();
  const params = req.nextUrl.searchParams;
  let consulta = createAdminClient()
    .from("solicitudes")
    .select("*, perfil:perfiles(nombre, email)")
    .order("created_at", { ascending: false });
  const estado = params.get("estado");
  if (estado) consulta = consulta.eq("estado", estado);
  if (params.get("email")) {
    const perfil = await perfilPorEmail(params.get("email"));
    if (!perfil) return fallo("No existe un usuario con ese email", 404);
    consulta = consulta.eq("perfil_id", perfil.id);
  }
  const { data, error } = await consulta;
  if (error) return fallo(error.message, 500);
  return NextResponse.json(data);
}

const TIPOS = ["gasolina", "velocidad", "tag"];

// POST /api/bot/solicitudes
// Body: { "email": "...", "tipo": "gasolina" | "velocidad" | "tag", "datos": { "kilometraje": "45210" }, "estado"?: "enviada" }
export async function POST(req: NextRequest) {
  if (!botAutorizado(req)) return noAutorizado();
  const body = (await leerJson(req)) as
    | { email?: string; tipo?: string; datos?: Record<string, unknown>; estado?: string }
    | undefined;
  if (!body?.tipo || !TIPOS.includes(body.tipo)) return fallo(`tipo debe ser ${TIPOS.join(", ")}`);
  const destino = await perfilRequerido(body.email);
  if (destino.respuesta) return destino.respuesta;

  const { data, error } = await createAdminClient()
    .from("solicitudes")
    .insert({
      perfil_id: destino.perfil.id,
      tipo: body.tipo,
      datos: body.datos ?? {},
      estado: body.estado ?? "pendiente",
    })
    .select()
    .single();
  if (error) return fallo(error.message, 500);
  return NextResponse.json({ ok: true, solicitud: data });
}
