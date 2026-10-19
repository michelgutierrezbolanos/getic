import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { botAutorizado, fallo, noAutorizado } from "@/lib/bot";

// GET /api/bot/usuarios[?enviar=true]
// Usuarios del portal y su opción "Enviar datos a portal alternativo".
export async function GET(req: NextRequest) {
  if (!botAutorizado(req)) return noAutorizado();
  let consulta = createAdminClient()
    .from("perfiles")
    .select("id, nombre, email, puesto, rol, enviar_portal_alternativo")
    .order("nombre");
  const enviar = req.nextUrl.searchParams.get("enviar");
  if (enviar === "true" || enviar === "false") consulta = consulta.eq("enviar_portal_alternativo", enviar === "true");
  const { data, error } = await consulta;
  if (error) return fallo(error.message, 500);
  return NextResponse.json(data);
}
