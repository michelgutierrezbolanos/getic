import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { botAutorizado, leerJson, noAutorizado } from "@/lib/bot";

const ESTADOS = ["procesando", "hecho", "error"];

// PATCH /api/bot/acciones/:id   Body: { "estado": "hecho" | "error" | "procesando", "error"?: "..." }
// Al terminar también actualiza la checada o la solicitud relacionada.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!botAutorizado(req)) return noAutorizado();
  const { id } = await params;
  const body = (await leerJson(req)) as { estado?: string; error?: string } | undefined;
  if (!body?.estado || !ESTADOS.includes(body.estado)) {
    return NextResponse.json({ error: `estado debe ser ${ESTADOS.join(", ")}` }, { status: 400 });
  }

  const db = createAdminClient();
  const terminado = body.estado !== "procesando";
  const { data: accion, error } = await db
    .from("acciones_bot")
    .update({
      estado: body.estado,
      error: body.error ?? null,
      procesado_at: terminado ? new Date().toISOString() : null,
    })
    .eq("id", Number(id))
    .select()
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!accion) return NextResponse.json({ error: "No existe la acción" }, { status: 404 });

  if (terminado) {
    const ok = body.estado === "hecho";
    if (accion.accion === "checada" && accion.payload?.checada_id) {
      await db.from("checadas").update({ estado: ok ? "hecho" : "error" }).eq("id", accion.payload.checada_id);
    }
    if (accion.accion === "solicitud" && accion.payload?.solicitud_id) {
      await db
        .from("solicitudes")
        .update({ estado: ok ? "enviada" : "error" })
        .eq("id", accion.payload.solicitud_id);
    }
  }

  return NextResponse.json({ ok: true, accion });
}
