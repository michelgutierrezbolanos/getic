"use client";

import { useEffect, useState } from "react";
import { tiempoEnVivo, type Reporte } from "@/lib/reportes";

export default function TiempoVivo({ reporte }: { reporte: Reporte }) {
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const t = tiempoEnVivo(reporte, ahora);
  if (!t) return null;
  return <b style={{ color: t.vencido ? "#ff1f1f" : "#000" }}>{t.texto}</b>;
}
