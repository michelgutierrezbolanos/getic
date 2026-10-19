import Header from "@/components/Header";
import MenuUsuario from "@/components/MenuUsuario";
import { createClient } from "@/lib/supabase/server";
import ListaUsuarios, { type Usuario } from "./lista-usuarios";

export const dynamic = "force-dynamic";
export const metadata = { title: "Configuración · Getic" };

export default async function Configuracion() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("perfiles")
    .select("id, nombre, email, puesto, rol, enviar_portal_alternativo")
    .order("nombre");

  const usuarios = (data ?? []) as Usuario[];
  const yo = usuarios.find((u) => u.id === user?.id);
  const esAdmin = yo?.rol === "admin";

  return (
    <>
      <Header>
        <MenuUsuario actual="/configuracion" />
      </Header>
      <main className="jqm-content fade-in">
        <div className="mx-auto max-w-[800px]">
          <h1 className="text-2xl font-bold">Configuración</h1>
          {error ? (
            <p className="mt-4 font-bold" style={{ color: "var(--error)" }}>
              No se pudo cargar la configuración: {error.message}. ¿Ya ejecutaste{" "}
              <code>0004_configuracion.sql</code> en Supabase?
            </p>
          ) : !yo ? (
            <p className="mt-4">No se encontró tu perfil.</p>
          ) : (
            <>
              <p className="mt-2 text-sm opacity-80">
                <b>Enviar datos a portal alternativo:</b> en SÍ, el bot copia tus reportes, horario, vehículo y
                checadas de Getic a este portal. En NO, el bot no guarda tus datos aquí.
              </p>
              <h2 className="mt-6 mb-2 text-lg font-bold">Mi cuenta</h2>
              <ListaUsuarios usuarios={[yo]} />
              {esAdmin && (
                <>
                  <h2 className="mt-8 mb-2 text-lg font-bold">Usuarios ({usuarios.length})</h2>
                  <ListaUsuarios usuarios={usuarios} />
                </>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
