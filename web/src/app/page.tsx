import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "./logout-button";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <Header>
        <LogoutButton />
      </Header>
      <main className="jqm-content fade-in">
        <p className="text-sm">
          Sesión iniciada como <b>{user?.email}</b>
        </p>
        <p className="mt-4 text-sm opacity-70">
          Aquí irá la tabla de reportes (siguiente etapa).
        </p>
      </main>
    </>
  );
}
