import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { botAutorizado, fallo, noAutorizado } from "@/lib/bot";

// GET /api/bot/usuarios → usuarios del portal (el bot los identifica por email).
export async function GET(req: NextRequest) {
  if (!botAutorizado(req)) return noAutorizado();
  const consulta = createAdminClient()
    .from("perfiles")
    .select("id, nombre, email, puesto, rol")
    .order("nombre");
  const { data, error } = await consulta;
  if (error) return fallo(error.message, 500);
  return NextResponse.json(data);
}
