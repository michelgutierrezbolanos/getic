import "server-only";
import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Valida "Authorization: Bearer <BOT_API_KEY>". */
export function botAutorizado(req: NextRequest) {
  const esperado = process.env.BOT_API_KEY?.trim();
  const recibido = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ?? "";
  if (!esperado || recibido.length !== esperado.length) return false;
  return timingSafeEqual(Buffer.from(recibido), Buffer.from(esperado));
}

export const noAutorizado = () => NextResponse.json({ error: "No autorizado" }, { status: 401 });

export async function leerJson(req: NextRequest): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return undefined;
  }
}

/** Busca el perfil por correo (el bot identifica a cada ingeniero así). */
export async function perfilPorEmail(email: unknown) {
  if (typeof email !== "string" || !email.trim()) return null;
  const { data } = await createAdminClient()
    .from("perfiles")
    .select("id, nombre, email")
    .ilike("email", email.trim())
    .maybeSingle();
  return data;
}
