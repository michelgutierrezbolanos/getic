import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/auth/getic-session   Body: { "email": "...", "nonce": "..." }
// Canjea el vale de un solo uso que el bot dejó al validar en Getic por una sesión
// de la app. No recibe ni usa la contraseña: solo confirma que el bot ya validó.
export async function POST(req: NextRequest) {
  let body: { email?: string; nonce?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const email = body.email?.trim().toLowerCase();
  const nonce = body.nonce?.trim();
  if (!email || !nonce) return NextResponse.json({ error: "Falta email o nonce" }, { status: 400 });

  const admin = createAdminClient();
  const { data: perfil } = await admin
    .from("perfiles")
    .select("id, login_nonce, login_nonce_at")
    .ilike("email", email)
    .maybeSingle();

  if (!perfil || perfil.login_nonce !== nonce) {
    return NextResponse.json({ error: "Validación no encontrada. Vuelve a iniciar sesión." }, { status: 401 });
  }
  // El vale dura 2 minutos
  if (!perfil.login_nonce_at || Date.now() - new Date(perfil.login_nonce_at).getTime() > 2 * 60_000) {
    return NextResponse.json({ error: "La validación expiró. Vuelve a iniciar sesión." }, { status: 401 });
  }

  // Un solo uso: se borra antes de abrir la sesión
  await admin.from("perfiles").update({ login_nonce: null, login_nonce_at: null }).eq("id", perfil.id);

  // Supabase abre la sesión sin pedir la contraseña (la validación la hizo Getic)
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (error || !data.properties?.hashed_token) {
    return NextResponse.json({ error: error?.message ?? "No se pudo abrir la sesión" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, email, token_hash: data.properties.hashed_token });
}

