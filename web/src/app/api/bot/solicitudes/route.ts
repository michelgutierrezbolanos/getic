import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { botAutorizado, fallo, noAutorizado, perfilPorEmail } from "@/lib/bot";

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
