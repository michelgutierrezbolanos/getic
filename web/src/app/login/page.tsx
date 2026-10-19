"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import GeticLogo from "@/components/GeticLogo";
import Header from "@/components/Header";

const REMEMBER_KEY = "getic_usuario";

export default function LoginPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [recordar, setRecordar] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    try {
      const guardado = localStorage.getItem(REMEMBER_KEY);
      if (guardado) setUsuario(guardado);
    } catch {}
  }, []);

  async function ingresar(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    if (!usuario.trim() || !password) {
      setError("Ingresa usuario y password");
      return;
    }
    setCargando(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: usuario.trim(),
      password,
    });
    setCargando(false);
    if (error) {
      setError("Usuario o password incorrectos");
      return;
    }
    try {
      if (recordar) localStorage.setItem(REMEMBER_KEY, usuario.trim());
      else localStorage.removeItem(REMEMBER_KEY);
    } catch {}
    router.replace("/");
    router.refresh();
  }

  return (
    <>
      <Header />
      <main className="jqm-content fade-in">
        <div className="mx-auto max-w-[800px]">
          <GeticLogo width="60%" />
          <form onSubmit={ingresar}>
            <p className="jqm-label">Usuario</p>
            <input
              className="jqm-input"
              type="email"
              autoComplete="username"
              placeholder="Usuario"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
            />
            <p className="jqm-label">Password</p>
            <input
              className="jqm-input"
              type="password"
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <label className="jqm-check mt-2">
              <input
                type="checkbox"
                checked={recordar}
                onChange={(e) => setRecordar(e.target.checked)}
              />
              Recordarme
            </label>
            {error && (
              <p className="my-2 text-sm font-bold" style={{ color: "var(--error)" }}>
                {error}
              </p>
            )}
            <button type="submit" className="jqm-btn-b" disabled={cargando}>
              {cargando ? "Ingresando..." : "Ingresar !"}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
