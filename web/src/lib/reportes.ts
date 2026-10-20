// Tipos y utilidades compartidas para los reportes clonados de Getic.

export const ZONA = "America/Mexico_City"; // Vallarta usa hora del centro (UTC-6)

export type Reporte = {
  folio: string;
  plaza: string | null;
  cliente: string | null;
  cr: string | null;
  tienda: string | null;
  tipo_registro: string | null;
  prioridad: string | null;
  grupo_servicio: string | null;
  concepto_servicio: string | null;
  categoria_opv: string | null;
  categoria_incidencia: string | null;
  reporte_folio: string | null;
  ingeniero_asignado: string | null;
  ati: string | null;
  estado: string | null;
  fecha_creacion: string | null;
  fecha_programacion: string | null;
  fecha_transferencia: string | null;
  fecha_asignacion: string | null;
  fecha_confirmacion: string | null;
  fecha_llegada: string | null;
  fecha_resuelto: string | null;
  tiempo_restante: string | null;
  tiempo_vencido: boolean;
  tiempo_capturado_at: string | null;
  solucion: string | null;
  vobo: string | null;
  atiende: string | null;
  folio_falso: string | null;
  inc_id: string | null;
  latitud: number | null;
  longitud: number | null;
  sla_minutos: number | null;
  fecha_limite: string | null;
  comentarios: Comentario[] | null;
  historial_tienda: IncidenciaTienda[] | null;
  pausado_at: string | null;
  estado_previo: string | null;
  updated_at: string;
};

export type Comentario = { usuario: string | null; mensaje: string; fecha: string; tipo: "otro" | "mio" | "historia" };

export type IncidenciaTienda = {
  folio: string;
  inc_id: string | null;
  tipo: string;
  concepto: string;
  nombre: string;
  fecha: string;
  descripcion: string;
  diagnostico: string;
  solucion: string;
};

/** Columnas que el bot o la alta manual pueden escribir. */
export const CAMPOS_EDITABLES = [
  "folio",
  "plaza",
  "cliente",
  "cr",
  "tienda",
  "tipo_registro",
  "prioridad",
  "grupo_servicio",
  "concepto_servicio",
  "categoria_opv",
  "categoria_incidencia",
  "reporte_folio",
  "ingeniero_asignado",
  "ati",
  "estado",
  "fecha_creacion",
  "fecha_programacion",
  "fecha_transferencia",
  "fecha_asignacion",
  "fecha_confirmacion",
  "fecha_llegada",
  "fecha_resuelto",
  "tiempo_restante",
  "tiempo_vencido",
  "tiempo_capturado_at",
  "solucion",
  "vobo",
  "atiende",
  "folio_falso",
  "evidencias",
  "inc_id",
  "latitud",
  "longitud",
  "sla_minutos",
  "fecha_limite",
  "comentarios",
  "historial_tienda",
  "pausado_at",
  "estado_previo",
] as const;

export const CAMPOS_FECHA = [
  "fecha_creacion",
  "fecha_programacion",
  "fecha_transferencia",
  "fecha_asignacion",
  "fecha_confirmacion",
  "fecha_llegada",
  "fecha_resuelto",
  "tiempo_capturado_at",
  "fecha_limite",
  "pausado_at",
] as const;

/**
 * Convierte una fecha como la muestra Getic a ISO (hora del centro).
 * Acepta "18/10/26 11:27 AM", "18/10/2026 19:23 PM" (24 h con sufijo) o ISO.
 */
export function parseFechaGetic(valor: unknown): string | null {
  if (valor == null || valor === "") return null;
  const texto = String(valor).trim();
  const m = texto.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AaPp][Mm])?)?$/,
  );
  if (m) {
    const [, d, mes, a, h = "0", min = "0", s = "0", ampm] = m;
    const anio = a.length === 2 ? 2000 + Number(a) : Number(a);
    let hora = Number(h);
    if (ampm && hora <= 12) {
      const pm = ampm.toUpperCase() === "PM";
      if (pm && hora < 12) hora += 12;
      if (!pm && hora === 12) hora = 0;
    }
    const pad = (n: number | string) => String(n).padStart(2, "0");
    return `${anio}-${pad(mes)}-${pad(d)}T${pad(hora)}:${pad(min)}:${pad(s)}-06:00`;
  }
  const fecha = new Date(texto);
  return Number.isNaN(fecha.getTime()) ? null : fecha.toISOString();
}

/** "18/10/26" y "11:27 AM" en hora del centro, como en la tabla de Getic. */
export function formatFecha(iso: string | null): [string, string] | null {
  if (!iso) return null;
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return null;
  const dia = new Intl.DateTimeFormat("es-MX", {
    timeZone: ZONA,
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(fecha);
  const hora = new Intl.DateTimeFormat("en-US", {
    timeZone: ZONA,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(fecha);
  return [dia, hora];
}

export function formatFechaLarga(iso: string | null): string {
  const f = formatFecha(iso);
  if (!f) return "";
  // "18/10/26" → "18/10/2026", igual que la ficha de Getic: "18/10/2026 11:27 AM"
  const [d, m, a] = f[0].split("/");
  return `${d}/${m}/20${a} ${f[1]}`;
}

/** "1dia(s) 21:20:24" → segundos. Devuelve null si no se reconoce. */
export function parseTiempo(texto: string | null): number | null {
  if (!texto) return null;
  const m = texto.match(/(?:(\d+)\s*d[ií]a(?:\(s\)|s)?\s*)?(\d+):(\d{2}):(\d{2})/i);
  if (!m) return null;
  const [, dias = "0", h, min, s] = m;
  return Number(dias) * 86400 + Number(h) * 3600 + Number(min) * 60 + Number(s);
}

/** Segundos → "1dia(s) 21:20:24" / "9:39:36", igual que Getic. */
export function formatTiempo(segundos: number): string {
  const total = Math.max(0, Math.floor(segundos));
  const dias = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const min = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${dias > 0 ? `${dias}dia(s) ` : ""}${h}:${min}:${s}`;
}

/**
 * Tiempo restante "en vivo": parte del valor que capturó el bot y descuenta
 * (o suma, si ya está vencido) los segundos transcurridos desde la captura.
 */
export function tiempoEnVivo(
  r: Pick<Reporte, "tiempo_restante" | "tiempo_vencido" | "tiempo_capturado_at"> & { fecha_limite?: string | null },
  ahora: number,
): { texto: string; vencido: boolean } | null {
  // Igual que Getic: límite = Hora Alta + SLA. Si el bot lo mandó, es lo más exacto.
  if (r.fecha_limite) {
    const diff = (new Date(r.fecha_limite).getTime() - ahora) / 1000;
    if (!Number.isNaN(diff)) return { texto: formatTiempo(Math.abs(diff)), vencido: diff < 0 };
  }
  const base = parseTiempo(r.tiempo_restante);
  if (base == null) return r.tiempo_restante ? { texto: r.tiempo_restante, vencido: r.tiempo_vencido } : null;
  const capturado = r.tiempo_capturado_at ? new Date(r.tiempo_capturado_at).getTime() : ahora;
  const transcurrido = Math.max(0, (ahora - capturado) / 1000);
  if (r.tiempo_vencido) return { texto: formatTiempo(base + transcurrido), vencido: true };
  const restante = base - transcurrido;
  return restante >= 0
    ? { texto: formatTiempo(restante), vencido: false }
    : { texto: formatTiempo(-restante), vencido: true };
}

/** Estados de Getic con el color exacto de su tabla. */
export const ESTADOS_GETIC = [
  { estado: "Sin Asignar", color: "rgba(255,0,0,0.5)" },
  { estado: "Asignado", color: "rgba(255,255,0,0.8)" },
  { estado: "Confirmado", color: "rgba(239,127,26,0.8)" },
  { estado: "LlegadaSitio", color: "rgba(27,117,187,0.6)" },
] as const;

/** Estado normalizado a los 4 de la tabla de Getic (o "Resuelto"). */
export function estadoGetic(estado: string | null): string {
  const e = (estado ?? "").toLowerCase().replace(/\s/g, "");
  if (e.includes("resuel") || e.includes("cerr") || e.includes("cancel")) return "Resuelto";
  if (e.includes("llegada") || e.includes("sitio") || e.includes("working") || e.includes("trabaj")) return "LlegadaSitio";
  if (e.includes("confirm")) return "Confirmado";
  if (e.includes("asignado") && !e.includes("sin")) return "Asignado";
  return "Sin Asignar"; // Abierto, Sin Asignar, vacío
}

/** Color de la fila según el estado, como en la tabla de Getic. */
export function colorFila(estado: string | null): string {
  const e = estadoGetic(estado);
  if (e === "Resuelto") return "rgba(82,255,0,0.57)";
  return ESTADOS_GETIC.find((x) => x.estado === e)?.color ?? "#fff";
}

/** URL de Google Maps de la tienda (igual que el enlace de Getic). */
export function urlMapa(r: Pick<Reporte, "latitud" | "longitud" | "cr" | "tienda">) {
  if (r.latitud != null && r.longitud != null) return `https://maps.google.com/maps?f=q&q=${r.latitud},${r.longitud}`;
  const q = [r.cr, r.tienda, "OXXO"].filter(Boolean).join(" ");
  return `https://maps.google.com/maps?f=q&q=${encodeURIComponent(q)}`;
}

/** Getic no deja tomar el folio hasta que tenga grupo y concepto de servicio. */
export function sinGrupoConcepto(r: Pick<Reporte, "grupo_servicio" | "concepto_servicio">) {
  const g = (r.grupo_servicio ?? "").toLowerCase();
  const c = (r.concepto_servicio ?? "").toLowerCase();
  return g === "" || g.includes("indefinido") || c.includes("indefinido");
}

export const ESTADOS_CERRADOS = ["resuelto", "cerrado", "cancelado"];

export function estaCerrado(estado: string | null) {
  const e = (estado ?? "").toLowerCase();
  return ESTADOS_CERRADOS.some((c) => e.includes(c));
}

const RANGO_PRIORIDAD: Record<string, number> = { alta: 0, media: 1, baja: 2 };

export function ordenarReportes(lista: Reporte[]) {
  return [...lista].sort((a, b) => {
    const pa = RANGO_PRIORIDAD[(a.prioridad ?? "").toLowerCase()] ?? 3;
    const pb = RANGO_PRIORIDAD[(b.prioridad ?? "").toLowerCase()] ?? 3;
    if (pa !== pb) return pa - pb;
    return (a.ingeniero_asignado ?? "").localeCompare(b.ingeniero_asignado ?? "");
  });
}

/** Limpia un objeto de entrada: solo campos conocidos y fechas en ISO. */
export function normalizarReporte(entrada: Record<string, unknown>) {
  const limpio: Record<string, unknown> = {};
  for (const campo of CAMPOS_EDITABLES) {
    if (!(campo in entrada)) continue;
    let valor = entrada[campo];
    if (typeof valor === "string") valor = valor.trim() === "" ? null : valor.trim();
    if ((CAMPOS_FECHA as readonly string[]).includes(campo)) valor = parseFechaGetic(valor);
    if (campo === "tiempo_vencido") valor = valor === true || valor === "true" || valor === 1;
    limpio[campo] = valor;
  }
  if (limpio.tiempo_restante && !limpio.tiempo_capturado_at) {
    limpio.tiempo_capturado_at = new Date().toISOString();
  }
  return limpio;
}
