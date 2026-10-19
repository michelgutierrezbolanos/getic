"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type Usuario = {
  id: string;
  nombre: string;
  email: string | null;
  puesto: string;
  rol: string;
  enviar_portal_alternativo: boolean;
};

function FilaUsuario({ usuario }: { usuario: Usuario }) {
  const [activo, setActivo] = useState(usuario.enviar_portal_alternativo);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cambiar() {
    const nuevo = !activo;
    setActivo(nuevo);
    setGuardando(true);
    setError(null);
    const { error } = await createClient()
      .from("perfiles")
      .update({ enviar_portal_alternativo: nuevo })
      .eq("id", usuario.id);
    setGuardando(false);
    if (error) {
      setActivo(!nuevo);
      setError(error.message);
    }
  }

  return (
    <div className="flex items-center gap-3 border-b px-4 py-3 last:border-b-0" style={{ borderColor: "var(--border)" }}>
      <div className="min-w-0 flex-1">
        <p className="font-bold">
          {usuario.nombre}
          {usuario.rol === "admin" && <span className="ml-2 text-xs font-normal opacity-60">admin</span>}
        </p>
        <p className="truncate text-sm opacity-70">{usuario.email}</p>
        {error && (
          <p className="text-sm font-bold" style={{ color: "var(--error)" }}>
            {error}
          </p>
        )}
      </div>
      <div className="text-right text-xs leading-tight opacity-80">
        Enviar datos a
        <br />
        portal alternativo
      </div>
      <span className="w-6 text-sm font-bold">{activo ? "Sí" : "No"}</span>
      <button
        type="button"
        role="switch"
        aria-checked={activo}
        aria-label={`Enviar datos a portal alternativo para ${usuario.nombre}`}
        className="switch"
        disabled={guardando}
        onClick={cambiar}
      />
    </div>
  );
}

export default function ListaUsuarios({ usuarios }: { usuarios: Usuario[] }) {
  return (
    <div className="rounded-md border bg-white" style={{ borderColor: "var(--border)", textShadow: "none" }}>
      {usuarios.map((u) => (
        <FilaUsuario key={u.id} usuario={u} />
      ))}
    </div>
  );
}
