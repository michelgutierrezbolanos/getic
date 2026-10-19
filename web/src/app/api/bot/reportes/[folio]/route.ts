import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { botAutorizado, fallo, leerJson, noAutorizado } from "@/lib/bot";
import { normalizarReporte } from "@/lib/reportes";

type Ctx = { params: Promise<{ folio: string }> };

// GET /api/bot/reportes/:folio
export async function GET(req: NextRequest, { params }: Ctx) {
  if (!botAutorizado(req)) return noAutorizado();
  const { folio } = await params;
  const { data, error } = await createAdminClient()
    .from("reportes")
    .select("*")
    .eq("folio", decodeURIComponent(folio))
    .maybeSingle();
  if (error) return fallo(error.message, 500);
  if (!data) return fallo("No existe el folio", 404);
  return NextResponse.json(data);
}

// PATCH /api/bot/reportes/:folio   Body: solo los campos que cambian, p. ej. { "estado": "En sitio" }
export async function PATCH(req: NextRequest, { params }: Ctx) {
  if (!botAutorizado(req)) return noAutorizado();
  const { folio } = await params;
  const body = await leerJson(req);
  if (!body || typeof body !== "object" || Array.isArray(body)) return fallo("JSON inválido");
  const cambios = normalizarReporte(body as Record<string, unknown>);
  delete cambios.folio;
  if (Object.keys(cambios).length === 0) return fallo("No hay campos para actualizar");

  const { data, error } = await createAdminClient()
    .from("reportes")
    .update(cambios)
    .eq("folio", decodeURIComponent(folio))
    .select()
    .maybeSingle();
  if (error) return fallo(error.message, 500);
  if (!data) return fallo("No existe el folio", 404);
  return NextResponse.json({ ok: true, reporte: data });
}

// DELETE /api/bot/reportes/:folio  (el folio ya no existe en Getic)
export async function DELETE(req: NextRequest, { params }: Ctx) {
  if (!botAutorizado(req)) return noAutorizado();
  const { folio } = await params;
  const { data, error } = await createAdminClient()
    .from("reportes")
    .delete()
    .eq("folio", decodeURIComponent(folio))
    .select("folio");
  if (error) return fallo(error.message, 500);
  if (!data?.length) return fallo("No existe el folio", 404);
  return NextResponse.json({ ok: true });
}
