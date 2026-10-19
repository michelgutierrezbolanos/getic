import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { botAutorizado, fallo, leerJson, noAutorizado } from "@/lib/bot";
import { estaCerrado, normalizarReporte, type Reporte } from "@/lib/reportes";

// GET /api/bot/reportes[?activos=true][&estado=Confirmado]
export async function GET(req: NextRequest) {
  if (!botAutorizado(req)) return noAutorizado();
  const params = req.nextUrl.searchParams;
  let consulta = createAdminClient().from("reportes").select("*").order("fecha_creacion", { ascending: false });
  const estado = params.get("estado");
  if (estado) consulta = consulta.ilike("estado", estado);
  const { data, error } = await consulta;
  if (error) return fallo(error.message, 500);
  const lista = data as Reporte[];
  return NextResponse.json(params.get("activos") === "true" ? lista.filter((r) => !estaCerrado(r.estado)) : lista);
}

// POST /api/bot/reportes
// Body: un reporte, una lista de reportes, o { "reportes": [...] }. Upsert por "folio".
export async function POST(req: NextRequest) {
  if (!botAutorizado(req)) return noAutorizado();

  const body = await leerJson(req);
  if (body === undefined) return fallo("JSON inválido");

  let lista: Record<string, unknown>[];
  if (body && !Array.isArray(body) && Array.isArray((body as { reportes?: unknown }).reportes)) {
    lista = (body as { reportes: Record<string, unknown>[] }).reportes;
  } else {
    lista = (Array.isArray(body) ? body : [body]) as Record<string, unknown>[];
  }

  const filas = lista.map(normalizarReporte);
  const sinFolio = filas.findIndex((f) => !f.folio);
  if (filas.length === 0 || sinFolio !== -1) {
    return fallo(`Cada reporte necesita "folio" (posición ${sinFolio})`);
  }

  const { data, error } = await createAdminClient()
    .from("reportes")
    .upsert(filas, { onConflict: "folio" })
    .select("folio");

  if (error) return fallo(error.message, 500);
  return NextResponse.json({ ok: true, guardados: data?.map((r) => r.folio) ?? [] });
}
