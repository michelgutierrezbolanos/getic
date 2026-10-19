import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/server";
import type { Reporte } from "@/lib/reportes";
import MenuUsuario from "@/components/MenuUsuario";
import TablaReportes from "./tabla-reportes";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("reportes").select("*");

  return (
    <>
      <Header>
        <MenuUsuario actual="/" />
      </Header>
      <main className="jqm-content fade-in">
        {error ? (
          <p className="font-bold" style={{ color: "var(--error)" }}>
            No se pudieron cargar los reportes: {error.message}
          </p>
        ) : (
          <TablaReportes iniciales={(data ?? []) as Reporte[]} />
        )}
      </main>
    </>
  );
}
