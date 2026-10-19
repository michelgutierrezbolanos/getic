import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { botAutorizado, fallo, leerJson, noAutorizado, perfilDestino, perfilPorEmail } from "@/lib/bot";

// GET /api/bot/vehiculo?email=...
export async function GET(req: NextRequest) {
  if (!botAutorizado(req)) return noAutorizado();
  const perfil = await perfilPorEmail(req.nextUrl.searchParams.get("email"));
  if (!perfil) return fallo("No existe un usuario con ese email", 404);
  const { data, error } = await createAdminClient()
    .from("vehiculos")
    .select("*")
    .eq("perfil_id", perfil.id)
    .maybeSingle();
  if (error) return fallo(error.message, 500);
  return NextResponse.json(data);
}

// POST /api/bot/vehiculo   Body: { "email": "...", "placa": "FKS316D", "numero_economico": "237" }
// Para quitar el vehículo manda placa y numero_economico en null.
export async function POST(req: NextRequest) {
  if (!botAutorizado(req)) return noAutorizado();
  const body = (await leerJson(req)) as
    | { email?: string; placa?: string | null; numero_economico?: string | null }
    | undefined;
  const destino = await perfilDestino(body?.email);
  if (destino.respuesta) return destino.respuesta;

  const { error } = await createAdminClient()
    .from("vehiculos")
    .upsert(
      {
        perfil_id: destino.perfil.id,
        placa: body?.placa ?? null,
        numero_economico: body?.numero_economico ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "perfil_id" },
    );
  if (error) return fallo(error.message, 500);
  return NextResponse.json({ ok: true });
}
