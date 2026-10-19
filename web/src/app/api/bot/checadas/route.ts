import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { botAutorizado, fallo, leerJson, noAutorizado, perfilRequerido, perfilPorEmail } from "@/lib/bot";
import { parseFechaGetic } from "@/lib/reportes";

const TIPOS = ["inicio", "comida_inicio", "comida_fin", "salida"];

const hoyCentro = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" }).format(new Date());

// GET /api/bot/checadas?email=...[&fecha=2026-10-19]
export async function GET(req: NextRequest) {
  if (!botAutorizado(req)) return noAutorizado();
  const params = req.nextUrl.searchParams;
  const perfil = await perfilPorEmail(params.get("email"));
  if (!perfil) return fallo("No existe un usuario con ese email", 404);
  const { data, error } = await createAdminClient()
    .from("checadas")
    .select("*")
    .eq("perfil_id", perfil.id)
    .eq("fecha", params.get("fecha") ?? hoyCentro())
    .order("hora");
  if (error) return fallo(error.message, 500);
  return NextResponse.json(data);
}

// POST /api/bot/checadas  Body: { "email": "...", "tipo": "inicio", "hora": "19/10/2026 08:28 AM", "fecha"?: "2026-10-19" }
// Para checadas hechas directamente en Getic (quedan como "hecho").
export async function POST(req: NextRequest) {
  if (!botAutorizado(req)) return noAutorizado();
  const body = (await leerJson(req)) as
    | { email?: string; tipo?: string; hora?: string; fecha?: string }
    | undefined;
  if (!body?.tipo || !TIPOS.includes(body.tipo)) return fallo(`tipo debe ser ${TIPOS.join(", ")}`);
  const destino = await perfilRequerido(body.email);
  if (destino.respuesta) return destino.respuesta;

  const hora = body.hora ? parseFechaGetic(body.hora) : new Date().toISOString();
  if (!hora) return fallo("hora inválida");
  const fecha =
    body.fecha ?? new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" }).format(new Date(hora));

  const { error } = await createAdminClient()
    .from("checadas")
    .upsert(
      { perfil_id: destino.perfil.id, fecha, tipo: body.tipo, hora, estado: "hecho" },
      { onConflict: "perfil_id,fecha,tipo" },
    );
  if (error) return fallo(error.message, 500);
  return NextResponse.json({ ok: true });
}
