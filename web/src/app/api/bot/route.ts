import { NextResponse, type NextRequest } from "next/server";
import { botAutorizado, noAutorizado } from "@/lib/bot";

// GET /api/bot → comprueba la clave (el bot lo llama al arrancar).
export async function GET(req: NextRequest) {
  if (!botAutorizado(req)) return noAutorizado();
  return NextResponse.json({ ok: true });
}
