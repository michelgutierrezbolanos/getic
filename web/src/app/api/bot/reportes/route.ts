import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { botAutorizado, leerJson, noAutorizado } from "@/lib/bot";
import { normalizarReporte } from "@/lib/reportes";

// Endpoint del bot: POST /api/bot/reportes
// Header: Authorization: Bearer <BOT_API_KEY>
// Body: un reporte o una lista de reportes (se hace upsert por "folio").

export async function POST(req: NextRequest) {
  if (!botAutorizado(req)) return noAutorizado();

  const body = await leerJson(req);
  if (body === undefined) return NextResponse.json({ error: "JSON inválido" }, { status: 400 });

  const lista = (Array.isArray(body) ? body : [body]) as Record<string, unknown>[];
  const filas = lista.map(normalizarReporte);
  const sinFolio = filas.findIndex((f) => !f.folio);
  if (filas.length === 0 || sinFolio !== -1) {
    return NextResponse.json(
      { error: `Cada reporte necesita "folio" (posición ${sinFolio})` },
      { status: 400 },
    );
  }

  const { data, error } = await createAdminClient()
    .from("reportes")
    .upsert(filas, { onConflict: "folio" })
    .select("folio");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, guardados: data?.map((r) => r.folio) ?? [] });
}
