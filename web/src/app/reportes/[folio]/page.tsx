import { notFound } from "next/navigation";
import Header from "@/components/Header";
import MenuUsuario from "@/components/MenuUsuario";
import { createClient } from "@/lib/supabase/server";
import type { Reporte } from "@/lib/reportes";
import DetalleFolio from "./detalle-folio";

export const dynamic = "force-dynamic";

export default async function DetalleReporte({ params }: { params: Promise<{ folio: string }> }) {
  const { folio } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [{ data }, { data: perfil }] = await Promise.all([
    supabase.from("reportes").select("*").eq("folio", decodeURIComponent(folio)).maybeSingle(),
    supabase.from("perfiles").select("nombre").eq("id", user?.id ?? "").maybeSingle(),
  ]);
  if (!data) notFound();

  return (
    <>
      <Header>
        <MenuUsuario />
      </Header>
      <main className="jqm-content fade-in">
        <DetalleFolio inicial={data as Reporte} miNombre={perfil?.nombre ?? ""} />
      </main>
    </>
  );
}
