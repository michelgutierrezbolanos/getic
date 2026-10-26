"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import "./login.css";

const REMEMBER_KEY = "getic_usuario";

function Franja({ ultimo }: { ultimo: string }) {
  return (
    <div className="lg-franja">
      <i style={{ width: 38, background: "#f28c28" }} />
      <i style={{ width: 19, background: "#0f8b8d" }} />
      <i style={{ width: 9, background: ultimo }} />
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [verPassword, setVerPassword] = useState(false);
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
      setError("Ingresa usuario y contraseña");
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
      setError("Usuario o contraseña incorrectos");
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
    <div className="lg">
      {/* Panel oscuro: marca y atardecer (el reflejo: naranja, verde mar y gris, como el avance) */}
      <aside className="lg-lado">
        <div className="lg-marca">
          <div className="lg-g">G</div>
          <div>
            <b>Getic</b>
            <span>Vallarta</span>
          </div>
        </div>
        <Franja ultimo="#fff" />
        <h2>
          Panel de
          <br />
          supervisión
        </h2>
        <p>Cada día cerramos con todo resuelto.</p>
        <svg className="lg-sol" viewBox="0 0 160 80" aria-hidden="true">
          <circle cx="58" cy="52" r="30" fill="#f28c28" />
          <rect x="0" y="52" width="160" height="30" fill="#111827" />
          <rect x="14" y="58" width="88" height="3.5" rx="1.75" fill="#f28c28" />
          <rect x="30" y="66" width="56" height="3.5" rx="1.75" fill="#0f8b8d" />
          <rect x="44" y="74" width="28" height="3.5" rx="1.75" fill="#9ca3af" />
        </svg>
      </aside>

      <div className="lg-form-zona">
        <form className="lg-form" onSubmit={ingresar}>
          <div className="lg-movil">
            <div className="lg-marca">
              <div className="lg-g">G</div>
              <div>
                <b>Getic</b>
                <span>Vallarta</span>
              </div>
            </div>
            <Franja ultimo="#111827" />
          </div>

          <h1>Bienvenido</h1>
          <p className="lg-sub">Entra con tu cuenta</p>

          <label htmlFor="usuario">Usuario</label>
          <div className="lg-campo">
            <input
              id="usuario"
              type="email"
              autoComplete="username"
              placeholder="usuario@getic.mx"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
            />
          </div>

          <label htmlFor="password">Contraseña</label>
          <div className="lg-campo">
            <input
              id="password"
              type={verPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ paddingRight: 44 }}
            />
            <button
              type="button"
              className="lg-ojo"
              aria-label={verPassword ? "Ocultar contraseña" : "Ver contraseña"}
              onClick={() => setVerPassword((v) => !v)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                <circle cx="12" cy="12" r="3" />
                {verPassword && <path d="M3 3l18 18" />}
              </svg>
            </button>
          </div>

          <label className="lg-recordar">
            <input type="checkbox" checked={recordar} onChange={(e) => setRecordar(e.target.checked)} />
            Recordarme
          </label>

          {error && <p className="lg-error">{error}</p>}

          <button type="submit" className="lg-entrar" disabled={cargando}>
            {cargando ? "Entrando…" : "Entrar"}
            {!cargando && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f28c28" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            )}
          </button>
        </form>
        <div className="lg-pie">Getic Vallarta · panel web</div>
      </div>
    </div>
  );
}
