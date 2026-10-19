"use client";

import { useState } from "react";

function Copiar({ texto, etiqueta = "Copiar" }: { texto: string; etiqueta?: string }) {
  const [hecho, setHecho] = useState(false);
  return (
    <button
      type="button"
      className="jqm-btn-small"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(texto);
        } catch {
          // Navegadores sin permiso de portapapeles: seleccionar a mano
          window.prompt("Copia el texto:", texto);
        }
        setHecho(true);
        setTimeout(() => setHecho(false), 1500);
      }}
    >
      {hecho ? "¡Copiado!" : etiqueta}
    </button>
  );
}

function BloqueCodigo({ texto }: { texto: string }) {
  return (
    <div className="relative">
      <pre className="codigo pr-20">{texto}</pre>
      <div className="absolute right-2 top-2">
        <Copiar texto={texto} />
      </div>
    </div>
  );
}

const PESTANAS = ["curl", "JavaScript", "Python"] as const;

export default function Conexion({ base, clave, guia }: { base: string; clave: string; guia: string }) {
  const [pestana, setPestana] = useState<(typeof PESTANAS)[number]>("curl");
  const [prueba, setPrueba] = useState<{ ok: boolean; texto: string } | null>(null);
  const [probando, setProbando] = useState(false);
  const api = `${base}/api/bot`;

  const ejemplos: Record<(typeof PESTANAS)[number], string> = {
    curl: `# Probar conexión
curl "${api}" \\
  -H "Authorization: Bearer ${clave}"

# Mandar un reporte
curl -X POST "${api}/reportes" \\
  -H "Authorization: Bearer ${clave}" \\
  -H "Content-Type: application/json" \\
  -d '{"folio":"INC00000001","cr":"50ABC","tienda":"Tienda PVA","estado":"Asignado","prioridad":"Alta","fecha_creacion":"18/10/2026 11:27 AM"}'`,
    JavaScript: `const API = "${api}";
const CLAVE = "${clave}";

async function api(metodo, ruta, body) {
  const res = await fetch(API + ruta, {
    method: metodo,
    headers: {
      Authorization: "Bearer " + CLAVE,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const datos = await res.json();
  if (!res.ok) throw new Error(\`\${res.status}: \${datos.error}\`);
  return datos;
}

// Probar conexión
console.log(await api("GET", ""));

// Acciones pedidas desde la app → ejecutarlas y marcarlas
for (const a of await api("GET", "/acciones?estado=pendiente")) {
  await api("PATCH", \`/acciones/\${a.id}\`, { estado: "procesando" });
  try {
    // ... ejecutar a.accion para a.folio en Getic ...
    await api("PATCH", \`/acciones/\${a.id}\`, { estado: "hecho" });
  } catch (e) {
    await api("PATCH", \`/acciones/\${a.id}\`, { estado: "error", error: String(e) });
  }
}`,
    Python: `import requests

API = "${api}"
CLAVE = "${clave}"
H = {"Authorization": f"Bearer {CLAVE}"}

def api(metodo, ruta, body=None):
    r = requests.request(metodo, API + ruta, headers=H, json=body, timeout=30)
    datos = r.json()
    if not r.ok:
        raise Exception(f"{r.status_code}: {datos.get('error')}")
    return datos

# Probar conexión
print(api("GET", ""))

# Acciones pedidas desde la app → ejecutarlas y marcarlas
for a in api("GET", "/acciones?estado=pendiente"):
    api("PATCH", f"/acciones/{a['id']}", {"estado": "procesando"})
    try:
        # ... ejecutar a["accion"] para a["folio"] en Getic ...
        api("PATCH", f"/acciones/{a['id']}", {"estado": "hecho"})
    except Exception as e:
        api("PATCH", f"/acciones/{a['id']}", {"estado": "error", "error": str(e)})`,
  };

  async function probar() {
    setProbando(true);
    setPrueba(null);
    try {
      const res = await fetch(`${api}`, { headers: { Authorization: `Bearer ${clave}` } });
      const datos = await res.json();
      setPrueba(
        res.ok
          ? { ok: true, texto: `Conexión correcta: ${datos.endpoints?.length ?? 0} endpoints disponibles.` }
          : { ok: false, texto: `${res.status}: ${datos.error}` },
      );
    } catch (e) {
      setPrueba({ ok: false, texto: String(e) });
    }
    setProbando(false);
  }

  return (
    <section className="conexion">
      <h2 className="text-xl font-bold">Cómo conectarse</h2>
      <table className="tabla-conexion mt-3">
        <tbody>
          <tr>
            <td>URL base</td>
            <td>
              <code>{api}</code>
            </td>
            <td>
              <Copiar texto={api} />
            </td>
          </tr>
          <tr>
            <td>Clave (BOT_API_KEY)</td>
            <td>
              {clave ? <code className="break-all">{clave}</code> : <i>No configurada en el servidor</i>}
            </td>
            <td>{clave && <Copiar texto={clave} />}</td>
          </tr>
          <tr>
            <td>Header obligatorio</td>
            <td>
              <code className="break-all">Authorization: Bearer {clave}</code>
            </td>
            <td>
              <Copiar texto={`Authorization: Bearer ${clave}`} />
            </td>
          </tr>
          <tr>
            <td>Con body (POST / PATCH)</td>
            <td>
              <code>Content-Type: application/json</code>
            </td>
            <td />
          </tr>
        </tbody>
      </table>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button className="btn-negro" onClick={probar} disabled={probando || !clave}>
          {probando ? "Probando…" : "Probar conexión"}
        </button>
        {prueba && (
          <span style={{ color: prueba.ok ? "#2e7d32" : "#c62828", fontWeight: 700 }}>
            {prueba.ok ? "✓" : "✕"} {prueba.texto}
          </span>
        )}
      </div>

      <h3 className="mt-6 font-bold">Ejemplos listos para usar</h3>
      <div className="pestanas mt-2">
        {PESTANAS.map((p) => (
          <button key={p} className={p === pestana ? "activa" : ""} onClick={() => setPestana(p)}>
            {p}
          </button>
        ))}
      </div>
      <BloqueCodigo texto={ejemplos[pestana]} />

      <h3 className="mt-6 font-bold">Reglas para que no falle</h3>
      <ul className="ml-5 mt-2 list-disc space-y-1 text-sm">
        <li>
          Usa siempre la URL de producción <code>{base}</code>. Las vistas previas de Vercel no tienen la clave.
        </li>
        <li>
          Manda el header <code>Authorization</code> en <b>todas</b> las peticiones y <code>Content-Type: application/json</code>{" "}
          cuando haya body.
        </li>
        <li>
          Fechas: <code>dd/mm/aaaa hh:mm AM</code> (como Getic, hora de Vallarta) o ISO 8601 (
          <code>2026-10-18T11:27:00-06:00</code>).
        </li>
        <li>
          El folio va en la URL codificado (<code>encodeURIComponent</code> / <code>urllib.parse.quote</code>).
        </li>
        <li>
          <code>POST /reportes</code> es upsert por <code>folio</code>: mandar el mismo folio otra vez lo actualiza, no lo
          duplica.
        </li>
        <li>
          Acciones: <code>procesando</code> al empezar y siempre <code>hecho</code> o <code>error</code> al terminar; si no,
          la app se queda en &quot;Enviando a Getic…&quot;.
        </li>
        <li>
          Códigos: <b>200</b> ok · <b>400</b> datos inválidos (lee <code>error</code>) · <b>401</b> clave incorrecta ·{" "}
          <b>404</b> no existe · <b>500</b> error del servidor (reintenta en unos segundos).
        </li>
        <li>Consulta cada 60–90 s; no hace falta más rápido.</li>
      </ul>

      <h3 className="mt-6 font-bold">Instrucciones completas para otro bot o IA</h3>
      <p className="text-sm opacity-80">
        Copia este texto y pégaselo al bot: trae la conexión, las reglas y todos los endpoints con sus ejemplos.
      </p>
      <div className="mt-2 flex justify-end">
        <Copiar texto={guia} etiqueta="Copiar instrucciones" />
      </div>
      <textarea className="guia-bot" readOnly value={guia} rows={14} />
    </section>
  );
}
