import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizarReporte } from "@/lib/reportes";

// Endpoint del bot: POST /api/bot/reportes
// Header: Authorization: Bearer <BOT_API_KEY>
// Body: un reporte o una lista de reportes (se hace upsert por "folio").

function autorizado(req: NextRequest) {
  const esperado = process.env.BOT_API_KEY;
  const recibido = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!esperado || recibido.length !== esperado.length) return false;
  return timingSafeEqual(Buffer.from(recibido), Buffer.from(esperado));
}

export async function POST(req: NextRequest) {
  if (!autorizado(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

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
