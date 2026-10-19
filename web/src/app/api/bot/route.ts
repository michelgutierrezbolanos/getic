import { NextResponse, type NextRequest } from "next/server";
import { botAutorizado, noAutorizado } from "@/lib/bot";
import { ENDPOINTS } from "@/lib/api-docs";

// GET /api/bot → comprueba la clave y lista todos los endpoints disponibles.
export async function GET(req: NextRequest) {
  if (!botAutorizado(req)) return noAutorizado();
  return NextResponse.json({
    ok: true,
    endpoints: ENDPOINTS.map(({ metodo, ruta, titulo }) => ({ metodo, ruta, titulo })),
  });
}
