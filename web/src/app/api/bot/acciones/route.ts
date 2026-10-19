import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { botAutorizado, noAutorizado } from "@/lib/bot";

// GET /api/bot/acciones?estado=pendiente&limit=50
// Devuelve las acciones que la app móvil pidió, con el reporte, el perfil del
// ingeniero y la solicitud (si aplica), para que el bot las ejecute en Getic.
export async function GET(req: NextRequest) {
  if (!botAutorizado(req)) return noAutorizado();

  const estado = req.nextUrl.searchParams.get("estado") ?? "pendiente";
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit")) || 50, 200);
  const db = createAdminClient();

  const { data: acciones, error } = await db
    .from("acciones_bot")
    .select("*, reporte:reportes(*)")
    .eq("estado", estado)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const perfilIds = [...new Set(acciones.map((a) => a.solicitado_por).filter(Boolean))];
  const solicitudIds = acciones
    .map((a) => a.payload?.solicitud_id)
    .filter((id): id is number => typeof id === "number");

  const [{ data: perfiles }, { data: solicitudes }] = await Promise.all([
    perfilIds.length
      ? db.from("perfiles").select("id, nombre, email, enviar_portal_alternativo").in("id", perfilIds)
      : Promise.resolve({ data: [] as { id: string; nombre: string; email: string; enviar_portal_alternativo: boolean }[] }),
    solicitudIds.length
      ? db.from("solicitudes").select("*").in("id", solicitudIds)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
  ]);

  return NextResponse.json(
    acciones.map((a) => ({
      ...a,
      perfil: perfiles?.find((p) => p.id === a.solicitado_por) ?? null,
      solicitud: solicitudes?.find((s) => s.id === a.payload?.solicitud_id) ?? null,
    })),
  );
}
