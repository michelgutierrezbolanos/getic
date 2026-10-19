import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { botAutorizado, fallo, leerJson, noAutorizado } from "@/lib/bot";
import { normalizarReporte, parseFechaGetic } from "@/lib/reportes";

// POST /api/bot/reportes/:folio/tomar | confirmar | llegada | cerrar
// Hace en el portal lo mismo que el botón en Getic: cambia el estado y guarda la fecha.
// Body opcional: { "fecha": "18/10/2026 07:23 PM", "estado": "...", ...cualquier campo del reporte }
// "cerrar" además requiere solucion, vobo y atiende.

const ACCIONES = {
  tomar: { estado: "Asignado", fecha: "fecha_asignacion" },
  confirmar: { estado: "Confirmado", fecha: "fecha_confirmacion" },
  llegada: { estado: "LlegadaSitio", fecha: "fecha_llegada" },
  cerrar: { estado: "Cerrado", fecha: "fecha_resuelto" },
} as const;

type Ctx = { params: Promise<{ folio: string; accion: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  if (!botAutorizado(req)) return noAutorizado();
  const { folio: folioUrl, accion } = await params;
  const config = ACCIONES[accion as keyof typeof ACCIONES];
  if (!config) return fallo(`Acción no válida. Usa: ${Object.keys(ACCIONES).join(", ")}`, 404);

  const body = ((await leerJson(req)) ?? {}) as Record<string, unknown>;
  if (typeof body !== "object" || Array.isArray(body)) return fallo("JSON inválido");

  if (accion === "cerrar") {
    const faltan = ["solucion", "vobo", "atiende"].filter((c) => !String(body[c] ?? "").trim());
    if (faltan.length) return fallo(`Faltan campos para cerrar: ${faltan.join(", ")}`);
  }

  const fecha = body.fecha ? parseFechaGetic(body.fecha) : new Date().toISOString();
  if (!fecha) return fallo("fecha inválida");

  const { fecha: _ignorada, ...resto } = body;
  void _ignorada;
  const cambios = {
    ...normalizarReporte(resto),
    estado: (typeof body.estado === "string" && body.estado.trim()) || config.estado,
    [config.fecha]: fecha,
  };
  delete cambios.folio;

  const { data, error } = await createAdminClient()
    .from("reportes")
    .update(cambios)
    .eq("folio", decodeURIComponent(folioUrl))
    .select()
    .maybeSingle();
  if (error) return fallo(error.message, 500);
  if (!data) return fallo("No existe el folio", 404);
  return NextResponse.json({ ok: true, reporte: data });
}
