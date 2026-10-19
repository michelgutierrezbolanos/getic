import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { botAutorizado, fallo, leerJson, noAutorizado } from "@/lib/bot";

const ESTADOS = ["pendiente", "enviada", "aprobada", "rechazada", "error"];

// PATCH /api/bot/solicitudes/:id   Body: { "estado": "aprobada" }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!botAutorizado(req)) return noAutorizado();
  const { id } = await params;
  const body = (await leerJson(req)) as { estado?: string } | undefined;
  if (!body?.estado || !ESTADOS.includes(body.estado)) return fallo(`estado debe ser ${ESTADOS.join(", ")}`);
  const { data, error } = await createAdminClient()
    .from("solicitudes")
    .update({ estado: body.estado })
    .eq("id", Number(id))
    .select()
    .maybeSingle();
  if (error) return fallo(error.message, 500);
  if (!data) return fallo("No existe la solicitud", 404);
  return NextResponse.json({ ok: true, solicitud: data });
}
