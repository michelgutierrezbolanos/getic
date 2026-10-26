import type { HorarioIngeniero } from "@/lib/supervisor";

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function nombreDia(fecha: string): string {
  return DIAS[new Date(`${fecha}T12:00:00Z`).getUTCDay()];
}
function ddmm(fecha: string): string {
  const [, m, d] = fecha.split("-");
  return `${d}/${m}`;
}
function hora12(t: string | null): string {
  if (!t) return "—";
  const [h, mm] = t.split(":");
  const H = Number(h);
  return `${String(H % 12 || 12).padStart(2, "0")}:${mm} ${H < 12 ? "a. m." : "p. m."}`;
}
function iniciales(nombre: string): string {
  const p = nombre.trim().split(/\s+/).filter(Boolean);
  return p.length ? ((p[0][0] ?? "") + (p[1]?.[0] ?? "")).toUpperCase() : "?";
}

export default function HorariosSupervisor({ semana, ingenieros }: { semana: string[]; ingenieros: HorarioIngeniero[] }) {
  const c = new Date(Date.now() - 6 * 3600 * 1000);
  const hoy = `${c.getUTCFullYear()}-${String(c.getUTCMonth() + 1).padStart(2, "0")}-${String(c.getUTCDate()).padStart(2, "0")}`;

  return (
    <>
      <div className="sv-cabecera">
        <div>
          <h1>Horarios</h1>
          <p>
            Semana del {ddmm(semana[0])} al {ddmm(semana[6])} · Vallarta
          </p>
        </div>
      </div>

      {ingenieros.length === 0 && <div className="sv-vacio">Sin ingenieros.</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 14 }}>
        {ingenieros.map((ing) => {
          const tiene = semana.some((f) => ing.dias[f]);
          return (
            <div key={ing.id} className="sv-tarjeta">
              <div className="sv-ing-top" style={{ padding: "14px 16px" }}>
                <div className="sv-avatar">{iniciales(ing.nombre)}</div>
                <b>{ing.nombre}</b>
              </div>
              {!tiene ? (
                <div className="sv-vacio" style={{ paddingTop: 10 }}>
                  Aún no se ha cargado su horario (reingresa en la app).
                </div>
              ) : (
                <div style={{ padding: "0 10px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
                  {semana.map((f) => {
                    const d = ing.dias[f];
                    const esHoy = f === hoy;
                    return (
                      <div
                        key={f}
                        style={{
                          display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10,
                          background: esHoy ? "#111827" : "#f3f4f6", color: esHoy ? "#fff" : "#1f2937",
                        }}
                      >
                        <div style={{ width: 104, flex: "none" }}>
                          {esHoy && <div style={{ fontSize: 11, color: "#f28c28", fontWeight: 600 }}>Hoy</div>}
                          <div style={{ fontSize: 13.5, fontWeight: 600 }}>{nombreDia(f)}</div>
                          <div style={{ fontSize: 11.5, color: esHoy ? "#9ca3af" : "#6b7280" }}>{ddmm(f)}</div>
                        </div>
                        <div style={{ flex: 1, fontSize: 13 }}>
                          {!d ? (
                            <span style={{ color: "#9ca3af" }}>Sin horario</span>
                          ) : d.descanso ? (
                            <span className="sv-chip" style={{ background: "#e6f4f4", color: "#0b5f60" }}>
                              Descanso
                            </span>
                          ) : (
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                              {(
                                [
                                  ["Entrada", d.entrada],
                                  ["Comida", d.comida],
                                  ["Salida", d.salida],
                                ] as [string, string | null][]
                              ).map(([t, v]) => (
                                <div key={t}>
                                  <div style={{ fontSize: 11, color: esHoy ? "#9ca3af" : "#6b7280" }}>{t}</div>
                                  <div style={{ fontWeight: 600 }}>{hora12(v)}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
