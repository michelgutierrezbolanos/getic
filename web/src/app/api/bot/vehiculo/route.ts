import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { botAutorizado, leerJson, noAutorizado, perfilPorEmail } from "@/lib/bot";

// POST /api/bot/vehiculo   Body: { "email": "...", "placa": "FKS316D", "numero_economico": "237" }
// Para quitar el vehículo manda placa y numero_economico en null.
export async function POST(req: NextRequest) {
  if (!botAutorizado(req)) return noAutorizado();
  const body = (await leerJson(req)) as
    | { email?: string; placa?: string | null; numero_economico?: string | null }
    | undefined;
  const perfil = await perfilPorEmail(body?.email);
  if (!perfil) return NextResponse.json({ error: "No existe un perfil con ese email" }, { status: 404 });

  const { error } = await createAdminClient()
    .from("vehiculos")
    .upsert(
      {
        perfil_id: perfil.id,
        placa: body?.placa ?? null,
        numero_economico: body?.numero_economico ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "perfil_id" },
    );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
