// Íconos simples (SVG) para el clon de Getic.
type P = { size?: number; color?: string };

export const IcoMenu = ({ size = 18, color = "#fff" }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden>
    <rect x="3" y="5" width="18" height="2.6" rx="1.3" />
    <rect x="3" y="10.7" width="18" height="2.6" rx="1.3" />
    <rect x="3" y="16.4" width="18" height="2.6" rx="1.3" />
  </svg>
);

export const IcoLista = ({ size = 18, color = "#fff" }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden>
    <circle cx="5" cy="6.3" r="1.6" />
    <circle cx="5" cy="12" r="1.6" />
    <circle cx="5" cy="17.7" r="1.6" />
    <rect x="8.5" y="5" width="12.5" height="2.6" rx="1.3" />
    <rect x="8.5" y="10.7" width="12.5" height="2.6" rx="1.3" />
    <rect x="8.5" y="16.4" width="12.5" height="2.6" rx="1.3" />
  </svg>
);

export const IcoReloj = ({ size = 34 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <circle cx="12" cy="12" r="10.5" fill="#ff1a1a" stroke="#000" strokeWidth="2" />
    <path d="M12 6.5V12l3.5 3" stroke="#000" strokeWidth="2" fill="none" strokeLinecap="round" />
  </svg>
);

export const IcoAuto = ({ size = 22 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#fff" aria-hidden>
    <path d="M5 11l1.6-4.2A2 2 0 0 1 8.5 5.5h7a2 2 0 0 1 1.9 1.3L19 11a2 2 0 0 1 1.5 1.9V17h-1.8v1.5a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1V17H8.3v1.5a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1V17H3.5v-4.1A2 2 0 0 1 5 11zm2.1 0h9.8l-1.1-3.1a.8.8 0 0 0-.8-.5H9a.8.8 0 0 0-.8.5L7.1 11zM6.5 15a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4zm11 0a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4z" />
  </svg>
);

export const IcoGas = ({ size = 22 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#fff" aria-hidden>
    <path d="M5 3.5h8a1 1 0 0 1 1 1v15h-10v-15a1 1 0 0 1 1-1zm1.5 2v4h5v-4h-5zM15 9l2.5 2v6a1 1 0 0 0 2 0V8.5L17 6l1-1 3 3v9a2.5 2.5 0 0 1-5 0v-5.5L15 10.7V9zM3 20h12v1.5H3z" />
  </svg>
);

export const IcoVelocidad = ({ size = 22 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" aria-hidden>
    <path d="M4 17a8 8 0 1 1 16 0" strokeLinecap="round" />
    <path d="M12 17l4-5" strokeLinecap="round" />
  </svg>
);

export const IcoTarjeta = ({ size = 22 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#1d3557" strokeWidth="1.8" aria-hidden>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 9.5h18M6 14h7M6 16.5h4" />
  </svg>
);

export const IcoChevron = ({ abierto = false }: { abierto?: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" aria-hidden
    style={{ transform: abierto ? "rotate(180deg)" : undefined, transition: "transform .2s" }}>
    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IcoImagen = () => (
  <svg width="50" height="36" viewBox="0 0 50 36" aria-hidden>
    <rect width="50" height="36" rx="5" fill="#333" />
    <path d="M8 28l10-11 8 8 5-5 11 8z" fill="#666" />
    <circle cx="36" cy="11" r="4" fill="#666" />
  </svg>
);

export const IcoDescarga = () => (
  <svg width="42" height="42" viewBox="0 0 24 24" fill="#fff" aria-hidden>
    <path d="M10 3h4v8h4l-6 6-6-6h4zM4 17h2v2h12v-2h2v4H4z" />
  </svg>
);
