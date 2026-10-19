import "server-only";
import { createClient } from "@/lib/supabase/server";

/** Usuario actual con su nombre y el puesto que copia el bot del inicio de Getic. */
export async function sesionActual() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [{ data: perfil }, { data: inicio }] = await Promise.all([
    supabase.from("perfiles").select("nombre, puesto").eq("id", user?.id ?? "").maybeSingle(),
    supabase.from("inicio_getic").select("datos").eq("perfil_id", user?.id ?? "").maybeSingle(),
  ]);
  const datos = (inicio?.datos ?? {}) as Record<string, unknown>;
  return {
    supabase,
    user,
    nombre: perfil?.nombre ?? user?.email ?? "",
    puesto: (datos.puesto as string | undefined) ?? perfil?.puesto ?? null,
    inicio: datos,
  };
}
