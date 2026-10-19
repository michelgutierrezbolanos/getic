"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import GeticLogo from "./GeticLogo";
import { IcoLista, IcoMenu } from "./iconos";

const nada = () => {};

/**
 * Encabezado y paneles laterales como app.getic.mx:
 * izquierdo = menú (Inicio, Operación, Cerrar Sesión); derecho = lista de tareas (solo visual).
 */
export default function GeticShell({
  nombre,
  puesto,
  children,
}: {
  nombre: string;
  puesto?: string | null;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [izq, setIzq] = useState(false);
  const [der, setDer] = useState(false);
  const [operacion, setOperacion] = useState(true);

  async function salir() {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <>
      <header className="jqm-header getic-header">
        <button className="btn-redondo izq" aria-label="Menú" onClick={() => setIzq(true)}>
          <IcoMenu />
        </button>
        <Link href="/" aria-label="Inicio">
          <GeticLogo width={80} color="#111" />
        </Link>
        <Link href="/api-docs" className="btn-api" title="Documentación de la API del bot">
          API
        </Link>
        <button className="btn-redondo der" aria-label="Lista de tareas" onClick={() => setDer(true)}>
          <IcoLista />
        </button>
      </header>

      {(izq || der) && <div className="panel-velo" onClick={() => (setIzq(false), setDer(false))} />}

      <aside className={`panel panel-izq ${izq ? "abierto" : ""}`} aria-hidden={!izq}>
        <div className="py-4">
          <GeticLogo width="85%" color="#111" />
        </div>
        <p className="text-center">
          <a className="font-bold underline" onClick={nada}>
            {nombre}
          </a>
          {puesto && (
            <>
              <br />({puesto})
            </>
          )}
        </p>
        <nav className="mt-6 flex flex-col gap-2">
          <Link href="/" className="panel-btn" onClick={() => setIzq(false)}>
            Inicio <span>⌂</span>
          </Link>
          <div className="panel-colapsable">
            <button className="panel-btn w-full" onClick={() => setOperacion((v) => !v)}>
              Operación <span>{operacion ? "−" : "+"}</span>
            </button>
            {operacion && (
              <div className="panel-sub">
                <Link href="/reportes" onClick={() => setIzq(false)}>
                  Lista de Folios
                </Link>
                <a onClick={nada}>Nuevo Folio</a>
                <a onClick={nada}>Solicitudes</a>
                <Link href="/api-docs" onClick={() => setIzq(false)}>
                  API del bot
                </Link>
              </div>
            )}
          </div>
          <button className="panel-btn mt-4" onClick={salir}>
            Cerrar Sesión <span>⏻</span>
          </button>
        </nav>
      </aside>

      <aside className={`panel panel-der ${der ? "abierto" : ""}`} aria-hidden={!der}>
        <div className="flex items-center justify-between">
          <b>Lista de tareas</b>
          <button className="jqm-btn-small" onClick={nada}>
            Nuevo
          </button>
        </div>
        <p className="mt-4 text-sm opacity-60">Sin tareas.</p>
      </aside>

      {children}
    </>
  );
}
