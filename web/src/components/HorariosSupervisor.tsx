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
  const ap = H < 12 ? "a. m." : "p. m.";
  const h12 = H % 12 || 12;
  return `${String(h12).padStart(2, "0")}:${mm} ${ap}`;
}

function iniciales(nombre: string): string {
  const p = nombre.trim().split(/\s+/).filter(Boolean);
  if (!p.length) return "?";
  return ((p[0][0] ?? "") + (p[1]?.[0] ?? "")).toUpperCase();
}

export default function HorariosSupervisor({ semana, ingenieros }: { semana: string[]; ingenieros: HorarioIngeniero[] }) {
  const hoy = (() => {
    const c = new Date(Date.now() - 6 * 3600 * 1000);
    return `${c.getUTCFullYear()}-${String(c.getUTCMonth() + 1).padStart(2, "0")}-${String(c.getUTCDate()).padStart(2, "0")}`;
  })();

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "16px 14px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <b style={{ fontSize: 20 }}>Horarios</b>
        <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Semana actual · Vallarta</div>
      </div>

      {ingenieros.length === 0 && <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Sin ingenieros.</p>}

      {ingenieros.map((ing) => {
        const tiene = semana.some((f) => ing.dias[f]);
        return (
          <div key={ing.id} style={{ background: "var(--surface-2)", border: "0.5px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 13px", borderBottom: "0.5px solid var(--border)" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#2C2C2A", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600 }}>
                {iniciales(ing.nombre)}
              </div>
              <b style={{ fontSize: 14 }}>{ing.nombre}</b>
            </div>
            {!tiene ? (
              <div style={{ padding: "12px 13px", fontSize: 13, color: "var(--text-muted)" }}>Aún no se ha cargado su horario (reingresa en la app).</div>
            ) : (
              <div>
                {semana.map((f) => {
                  const d = ing.dias[f];
                  const esHoy = f === hoy;
                  return (
                    <div
                      key={f}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "9px 13px",
                        borderTop: "0.5px solid var(--border)",
                        background: esHoy ? "var(--bg-accent, rgba(47,107,216,.08))" : undefined,
                      }}
                    >
                      <div style={{ width: 120, flex: "none" }}>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>
                          {nombreDia(f)} {esHoy ? <span style={{ color: "var(--text-accent)", fontSize: 11 }}>· HOY</span> : null}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{ddmm(f)}</div>
                      </div>
                      <div style={{ flex: 1, fontSize: 13 }}>
                        {!d ? (
                          <span style={{ color: "var(--text-muted)" }}>Sin horario</span>
                        ) : d.descanso ? (
                          <span style={{ color: "var(--text-secondary)" }}>Descanso</span>
                        ) : (
                          <span>
                            Entrada {hora12(d.entrada)} · Comida {hora12(d.comida)} · Salida {hora12(d.salida)}
                          </span>
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
  );
}
