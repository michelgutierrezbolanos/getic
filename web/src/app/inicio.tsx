"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  IcoAuto,
  IcoChevron,
  IcoDescarga,
  IcoGas,
  IcoImagen,
  IcoReloj,
  IcoTarjeta,
  IcoVelocidad,
} from "@/components/iconos";
import { ZONA, estaCerrado, tiempoEnVivo, type Reporte } from "@/lib/reportes";
import GasolinaPanel from "@/components/gasolina-panel";

export type DiaHorario = {
  fecha: string;
  entrada: string | null;
  comida: string | null;
  salida: string | null;
  descanso: boolean;
};

type FilaMomento = { nombre: string; nivel: string } & Record<string, string | number>;

const nada = () => {};
const DIAS = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];
const COLUMNAS = ["INC", "MTT", "REQ", "APE", "PE", "RT", "RT_CCTV"];

/** "16:00:00" → "04:00 PM" */
function hora12(t: string | null) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${String(h % 12 || 12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

/** Fecha de hoy en Vallarta, p. ej. "Domingo 18 Octubre 2026" */
function hoyLargo() {
  const partes = new Intl.DateTimeFormat("es-MX", {
    timeZone: ZONA,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).formatToParts(new Date());
  const v = (t: string) => partes.find((p) => p.type === t)?.value ?? "";
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  return `${cap(v("weekday"))} ${v("day")} ${cap(v("month"))} ${v("year")}`;
}

/** Lunes a domingo de esta semana (hora del centro) en formato yyyy-mm-dd. */
function semanaActual() {
  const hoy = new Date(new Date().toLocaleString("en-US", { timeZone: ZONA }));
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7));
  return DIAS.map((_, i) => {
    const d = new Date(lunes);
    d.setDate(lunes.getDate() + i);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
}

function Colapsable({
  titulo,
  oscuro = false,
  children,
}: {
  titulo: React.ReactNode;
  oscuro?: boolean;
  children: React.ReactNode;
}) {
  const [abierto, setAbierto] = useState(false);
  return (
    <div className="colapsable">
      <button className={`colapsable-titulo ${oscuro ? "gris" : ""}`} onClick={() => setAbierto((v) => !v)}>
        <span>{titulo}</span>
        <IcoChevron abierto={abierto} />
      </button>
      {abierto && <div className="colapsable-cuerpo">{children}</div>}
    </div>
  );
}

function Pestanas({ nombres, children }: { nombres: string[]; children: (i: number) => React.ReactNode }) {
  const [activa, setActiva] = useState(0);
  return (
    <div>
      <div className="pestanas">
        {nombres.map((n, i) => (
          <button key={n} className={i === activa ? "activa" : ""} onClick={() => setActiva(i)}>
            {n}
          </button>
        ))}
      </div>
      {children(activa)}
    </div>
  );
}

export default function Inicio({
  nombre,
  reportes,
  horario,
  vehiculo,
  resumen,
}: {
  nombre: string;
  reportes: Reporte[];
  horario: DiaHorario[];
  vehiculo: { placa: string | null; numero_economico: string | null } | null;
  resumen: Record<string, unknown>;
}) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [foliosAbierto, setFoliosAbierto] = useState(true);
  const [ahora, setAhora] = useState(() => Date.now());
  const [gasAbierto, setGasAbierto] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const activos = useMemo(() => reportes.filter((r) => !estaCerrado(r.estado)), [reportes]);
  const semana = useMemo(semanaActual, []);
  const porFecha = useMemo(() => Object.fromEntries(horario.map((h) => [h.fecha, h])), [horario]);

  // "Al Momento": lo que copió el bot; INC siempre con el conteo real del portal
  const filas: FilaMomento[] = useMemo(() => {
    const copia = (resumen.folios_al_momento as FilaMomento[] | undefined) ?? [];
    const base: FilaMomento[] = copia.length
      ? copia
      : [
          { nombre: "Región Sinaloa", nivel: "region" },
          { nombre: activos[0]?.plaza ?? "OPV-Prov Vallarta", nivel: "plaza" },
          { nombre: "OXXO MX", nivel: "udn" },
          { nombre: "TOTAL FOLIOS", nivel: "total" },
        ];
    return base.map((f) => ({ ...f, INC: !copia.length || Number(f.INC) > 0 ? activos.length : 0 }));
  }, [resumen, activos]);

  const proximos = useMemo(
    () =>
      activos
        .map((r) => ({ r, t: tiempoEnVivo(r, ahora) }))
        .filter((x) => x.t && !x.t.vencido)
        .sort((a, b) => new Date(a.r.fecha_limite ?? 0).getTime() - new Date(b.r.fecha_limite ?? 0).getTime()),
    [activos, ahora],
  );

  const anuncios = (resumen.anuncios as string[] | undefined) ?? [];
  const diasSiniestros = resumen.dias_sin_siniestros as number | undefined;
  const sla = resumen.sla_mes as string | undefined;
  const nombreCorto = nombre.split(" ").slice(0, 3).join(" ");

  function buscar(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/reportes${busqueda.trim() ? `?q=${encodeURIComponent(busqueda.trim())}` : ""}`);
  }

  return (
    <div className="inicio-getic">
      <GasolinaPanel open={gasAbierto} onClose={() => setGasAbierto(false)} />
      <Colapsable titulo={`Dias sin siniestros: ${diasSiniestros ?? "—"}`}>
        <p className="text-sm opacity-60">Sin información.</p>
      </Colapsable>

      <h2 className="inicio-subtitulo">Resumen de actividad</h2>
      <p className="mt-8">
        <b>{nombreCorto}</b> SLA del Mes <b>{sla ?? "—"}</b>
      </p>

      {/* Horario Asignado */}
      <div className="caja mt-2">
        <div className="horario">
          <div className="horario-cabeza">Horario Asignado</div>
          <div className="horario-cuerpo">
            {DIAS.map((dia, i) => {
              const h = porFecha[semana[i]];
              const libre = !h || h.descanso;
              return (
                <div key={dia} className="horario-dia">
                  <div className={libre ? "inactivo" : "activo"}>{dia}</div>
                  {!libre && (
                    <>
                      <div className="hh">Entrada</div>
                      <div className="hv">{hora12(h.entrada)}</div>
                      <div className="hh">Comida</div>
                      <div className="hv">{hora12(h.comida)}</div>
                      <div className="hh">Salida</div>
                      <div className="hv">{hora12(h.salida)}</div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Inicio de labores (solo visual) */}
      <div className="caja tarjeta-fila">
        <span>No ha marcado su inicio de labores</span>
        <button className="btn-circulo" onClick={nada} aria-label="Inicio de labores">
          <IcoReloj size={46} />
        </button>
      </div>

      {/* Vehículo (solo visual) */}
      <div className="caja tarjeta-fila">
        <div>
          {vehiculo?.placa ? (
            <>
              <p>Numero de Placa: {vehiculo.placa}</p>
              <p className="mt-3">Numero Economico: {vehiculo.numero_economico}</p>
            </>
          ) : (
            <p>Sin Vehiculo Asignado</p>
          )}
        </div>
        <div className="flex gap-2">
          <button className="btn-circulo verde" onClick={nada} aria-label="Vehículo">
            <IcoAuto />
          </button>
          <button className="btn-circulo borde" onClick={nada} aria-label="Más opciones">
            •••
          </button>
        </div>
      </div>

      {/* Solicitar (solo visual) */}
      <div className="caja tarjeta-fila">
        <b className="text-xl">Solicitar</b>
        <div className="flex gap-2">
          <button className="btn-circulo naranja" onClick={() => setGasAbierto(true)} aria-label="Solicitar gasolina">
            <IcoGas />
          </button>
          <button className="btn-circulo gris" onClick={nada} aria-label="Solicitar aumento de velocidad">
            <IcoVelocidad />
          </button>
          <button className="btn-circulo azul" onClick={nada} aria-label="Solicitar activación de tag">
            <IcoTarjeta />
          </button>
        </div>
      </div>

      <Colapsable titulo="Solicitudes en proceso" oscuro>
        <p className="text-sm opacity-60">Sin solicitudes en proceso.</p>
      </Colapsable>

      {/* Barra: Actualizar · Calendario · Nuevo Ticket · Plazas · buscador de folio */}
      <form className="barra-inicio" onSubmit={buscar}>
        <button type="button" className="btn-icono" title="Actualizar" onClick={() => router.refresh()}>
          ⟳
        </button>
        <button type="button" className="btn-icono" title="Lista de Tickets" onClick={nada}>
          ▦
        </button>
        <button type="button" className="btn-icono" title="Nuevo Ticket" onClick={nada}>
          ＋
        </button>
        <button type="button" className="btn-icono" title="Plazas Asignadas" onClick={nada}>
          ●
        </button>
        <div className="buscador-folio">
          <input placeholder="INC000 CR:50EXP" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          <button type="submit" aria-label="Buscar folio">
            ⌕
          </button>
        </div>
      </form>

      {/* Al Momento */}
      <div className="caja">
        <div className="pestanas">
          <button className="activa">Al Momento</button>
        </div>
        <button className="barra-negra" onClick={() => setFoliosAbierto((v) => !v)}>
          Folios ({hoyLargo()})
          <br />
          (colapsar /expandir)
        </button>
        {foliosAbierto && (
          <table className="tabla-momento">
            <thead>
              <tr>
                <td>
                  <b>Región / Plaza / UDN</b>
                </td>
                {COLUMNAS.map((c) => (
                  <td key={c}>
                    <b>{c}</b>
                  </td>
                ))}
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.nombre} className={`nivel-${f.nivel}`}>
                  <td>{f.nombre}</td>
                  {COLUMNAS.map((c) => {
                    const v = Number(f[c] ?? 0);
                    const enlace = c === "INC" && v > 0 && (f.nivel === "plaza" || f.nivel === "udn");
                    return (
                      <td key={c}>
                        {enlace ? (
                          <Link href="/reportes" className="underline">
                            {v}
                          </Link>
                        ) : v > 0 && (f.nivel === "plaza" || f.nivel === "udn") ? (
                          <a className="underline" onClick={nada}>
                            {v}
                          </a>
                        ) : (
                          v
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* IFS's en operación / Folios próximos a vencer */}
      <div className="caja">
        <Pestanas nombres={["IFS's en operación", "Folios próximos a vencer"]}>
          {(i) => (
            <>
              <div className="barra-negra delgada" />
              {i === 0 ? (
                <p className="p-2 text-sm opacity-60">Sin información.</p>
              ) : proximos.length === 0 ? (
                <p className="p-2 text-sm opacity-60">Sin folios próximos a vencer.</p>
              ) : (
                <table className="tabla-momento">
                  <tbody>
                    {proximos.map(({ r, t }) => (
                      <tr key={r.folio}>
                        <td>
                          <Link href={`/reportes/${encodeURIComponent(r.folio)}`} className="font-bold underline">
                            {r.folio}
                          </Link>
                        </td>
                        <td>{[r.cr, r.tienda].filter(Boolean).join(" - ")}</td>
                        <td>{r.ingeniero_asignado}</td>
                        <td className="font-bold">{t?.texto}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </Pestanas>
      </div>

      {/* Mantenimientos / Aprovisionamiento / Recursos Humanos (solo visual) */}
      <div className="caja">
        <Pestanas nombres={["Mantenimientos", "Aprovisionamiento", "Recursos Humanos"]}>
          {() => (
            <>
              <div className="barra-negra">Solicitudes</div>
              <table className="tabla-momento">
                <thead>
                  <tr>
                    {["Plaza", "En proceso", "Resuelto mes", "Cotización", "C. Autorizadas", "Gastos"].map((c) => (
                      <td key={c}>
                        <b>{c}</b>
                      </td>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Total Solicitudes</td>
                    <td>
                      <a className="font-bold underline" onClick={nada}>
                        0
                      </a>
                    </td>
                    <td>
                      <a className="font-bold underline" onClick={nada}>
                        0
                      </a>
                    </td>
                    <td />
                    <td />
                    <td />
                  </tr>
                </tbody>
              </table>
            </>
          )}
        </Pestanas>
      </div>

      {/* Anuncios / Notificaciones (solo visual) */}
      <div className="caja">
        <div className="barra-negra">Anuncios / Notificaciones</div>
        <div className="mt-4 flex flex-col gap-2.5">
          {(anuncios.length ? anuncios : ["Sin anuncios"]).map((a) => (
            <button key={a} className="anuncio" onClick={nada}>
              <span>{a}</span>
              {/\.(docx?|pdf)$|FACTURACION/i.test(a) ? <IcoDescarga /> : <IcoImagen />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
