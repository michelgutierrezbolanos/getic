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

export const fallo = (mensaje: string, status = 400) => NextResponse.json({ error: mensaje }, { status });

export async function leerJson(req: NextRequest): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return undefined;
  }
}

export type PerfilBot = { id: string; nombre: string; email: string; rol: string };

/** Busca el perfil por correo (el bot identifica a cada ingeniero así). */
export async function perfilPorEmail(email: unknown): Promise<PerfilBot | null> {
  if (typeof email !== "string" || !email.trim()) return null;
  const { data } = await createAdminClient()
    .from("perfiles")
    .select("id, nombre, email, rol")
    .ilike("email", email.trim())
    .maybeSingle();
  return data;
}

/** Igual que perfilPorEmail, pero si no existe ya trae la respuesta 404. */
export async function perfilRequerido(
  email: unknown,
): Promise<{ perfil: PerfilBot; respuesta?: never } | { perfil?: never; respuesta: NextResponse }> {
  const perfil = await perfilPorEmail(email);
  return perfil ? { perfil } : { respuesta: fallo("No existe un usuario con ese email", 404) };
}
