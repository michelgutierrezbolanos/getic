import type { HorarioIngeniero } from "@/lib/supervisor";

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const COL = {
  pageText: "#2b2b2b", sec: "#5a6672", muted: "#8a929b",
  cardBg: "#ffffff", cardBorder: "#e3e6ea", accent: "#1f539f", hoy: "#e7f0fb",
};

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
    <div style={{ maxWidth: 1500, margin: "0 auto", padding: "22px 28px", display: "flex", flexDirection: "column", gap: 18, color: COL.pageText }}>
      <div>
        <b style={{ fontSize: 22, textShadow: "none" }}>Horarios</b>
        <div style={{ fontSize: 13, color: COL.sec, textShadow: "none" }}>Semana actual · Vallarta</div>
      </div>

      {ingenieros.length === 0 && <p style={{ color: COL.muted, fontSize: 13 }}>Sin ingenieros.</p>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: 16 }}>
        {ingenieros.map((ing) => {
          const tiene = semana.some((f) => ing.dias[f]);
          return (
            <div key={ing.id} style={{ background: COL.cardBg, border: `1px solid ${COL.cardBorder}`, borderRadius: 12, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderBottom: `1px solid ${COL.cardBorder}` }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#2C2C2A", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, textShadow: "none" }}>
                  {iniciales(ing.nombre)}
                </div>
                <b style={{ fontSize: 15, textShadow: "none" }}>{ing.nombre}</b>
              </div>
              {!tiene ? (
                <div style={{ padding: "14px", fontSize: 13, color: COL.muted }}>Aún no se ha cargado su horario (reingresa en la app).</div>
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
                          padding: "10px 14px",
                          borderTop: `1px solid ${COL.cardBorder}`,
                          background: esHoy ? COL.hoy : undefined,
                        }}
                      >
                        <div style={{ width: 130, flex: "none" }}>
                          <div style={{ fontSize: 13, fontWeight: 600, textShadow: "none" }}>
                            {nombreDia(f)} {esHoy ? <span style={{ color: COL.accent, fontSize: 11 }}>· HOY</span> : null}
                          </div>
                          <div style={{ fontSize: 11, color: COL.muted }}>{ddmm(f)}</div>
                        </div>
                        <div style={{ flex: 1, fontSize: 13, color: COL.pageText, textShadow: "none" }}>
                          {!d ? (
                            <span style={{ color: COL.muted }}>Sin horario</span>
                          ) : d.descanso ? (
                            <span style={{ color: COL.sec }}>Descanso</span>
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
    </div>
  );
}
