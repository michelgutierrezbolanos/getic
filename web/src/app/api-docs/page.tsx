import { headers } from "next/headers";
import Header from "@/components/Header";
import MenuUsuario from "@/components/MenuUsuario";
import { ENDPOINTS, type Endpoint } from "@/lib/api-docs";

export const metadata = { title: "API del bot · Getic" };

const COLOR_METODO: Record<Endpoint["metodo"], string> = {
  GET: "#2e7d32",
  POST: "#1565c0",
  PATCH: "#ef6c00",
  DELETE: "#c62828",
};

function Json({ valor }: { valor: unknown }) {
  return <pre className="codigo">{JSON.stringify(valor, null, 2)}</pre>;
}

function curl(base: string, e: Endpoint) {
  const ruta = e.ruta.replace("{folio}", "INC14911536").replace("{id}", "12");
  const partes = [`curl -X ${e.metodo} "${base}${ruta}"`, `  -H "Authorization: Bearer $BOT_API_KEY"`];
  if (e.body !== undefined) {
    partes.push(`  -H "Content-Type: application/json"`, `  -d '${JSON.stringify(e.body)}'`);
  }
  return partes.join(" \\\n");
}

export default async function ApiDocs() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const protocolo = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const base = `${protocolo}://${host}`;
  const grupos = [...new Set(ENDPOINTS.map((e) => e.grupo))];

  return (
    <>
      <Header>
        <MenuUsuario actual="/api-docs" />
      </Header>
      <main className="jqm-content fade-in">
        <div className="mx-auto max-w-[960px]">
          <h1 className="text-2xl font-bold">API del bot</h1>
          <p className="mt-2">
            Base: <code className="codigo-linea">{base}</code>. Todas las rutas necesitan el header{" "}
            <code className="codigo-linea">Authorization: Bearer &lt;BOT_API_KEY&gt;</code> y responden JSON. Los
            errores vienen como <code className="codigo-linea">{`{ "error": "..." }`}</code> con código 4xx/5xx.
          </p>
          <div className="aviso mt-4">
            <b>Enviar datos a portal alternativo.</b> Cada usuario la activa o desactiva en{" "}
            <a href="/configuracion" className="underline">
              Configuración
            </a>
            . Los endpoints marcados con <span className="etiqueta-opcion">respeta opción</span> no guardan nada
            si ese usuario está en NO y responden <code className="codigo-linea">{`{ "ok": true, "omitido": true }`}</code>.
            Usa <code className="codigo-linea">GET /api/bot/usuarios?enviar=true</code> para sincronizar solo a
            los usuarios en SÍ.
          </div>

          <h2 className="mt-6 text-lg font-bold">Flujo del bot</h2>
          <ol className="ml-5 mt-2 list-decimal space-y-1">
            <li>Leer usuarios activos con <code className="codigo-linea">GET /api/bot/usuarios?enviar=true</code>.</li>
            <li>Por cada uno, leer Getic y mandar reportes, horario, vehículo y checadas.</li>
            <li>
              Cada pocos segundos, <code className="codigo-linea">GET /api/bot/acciones</code>, ejecutar cada acción
              en Getic (o el WhatsApp de cierre) y marcarla con{" "}
              <code className="codigo-linea">PATCH /api/bot/acciones/&#123;id&#125;</code>.
            </li>
            <li>Volver a mandar el reporte actualizado para que web y app vean el nuevo estado.</li>
          </ol>

          <nav className="mt-6 flex flex-wrap gap-2">
            {grupos.map((g) => (
              <a key={g} href={`#${g}`} className="jqm-btn-small">
                {g}
              </a>
            ))}
          </nav>

          {grupos.map((g) => (
            <section key={g} id={g} className="mt-8">
              <h2 className="mb-3 border-b pb-1 text-xl font-bold">{g}</h2>
              {ENDPOINTS.filter((e) => e.grupo === g).map((e) => (
                <article key={e.metodo + e.ruta} className="endpoint">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="metodo" style={{ background: COLOR_METODO[e.metodo] }}>
                      {e.metodo}
                    </span>
                    <code className="font-bold">{e.ruta}</code>
                    {e.respetaOpcion && <span className="etiqueta-opcion">respeta opción</span>}
                  </div>
                  <h3 className="mt-2 font-bold">{e.titulo}</h3>
                  <p className="mt-1 text-sm">{e.descripcion}</p>
                  {e.query && (
                    <p className="mt-2 text-sm">
                      <b>Parámetros:</b> <code>{e.query}</code>
                    </p>
                  )}
                  {e.body !== undefined && (
                    <>
                      <p className="mt-3 text-sm font-bold">Body</p>
                      <Json valor={e.body} />
                    </>
                  )}
                  {e.respuesta !== undefined && (
                    <>
                      <p className="mt-3 text-sm font-bold">Respuesta</p>
                      <Json valor={e.respuesta} />
                    </>
                  )}
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm font-bold">Ejemplo con curl</summary>
                    <pre className="codigo">{curl(base, e)}</pre>
                  </details>
                </article>
              ))}
            </section>
          ))}
        </div>
      </main>
    </>
  );
}
