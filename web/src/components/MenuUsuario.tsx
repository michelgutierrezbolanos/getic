import Link from "next/link";
import LogoutButton from "@/app/logout-button";

const LINKS = [
  { href: "/", texto: "Reportes" },
  { href: "/api-docs", texto: "API" },
];

export default function MenuUsuario({ actual }: { actual?: string }) {
  return (
    <nav className="flex items-center gap-1">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="jqm-btn-small hidden sm:inline-block"
          style={actual === l.href ? { background: "#333", color: "#fff", textShadow: "none" } : undefined}
        >
          {l.texto}
        </Link>
      ))}
      <LogoutButton />
    </nav>
  );
}
