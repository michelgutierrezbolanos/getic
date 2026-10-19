// Marca "Getic" en gris, como en el login oficial. Reemplazable por public/getic.webp.
export default function GeticLogo({
  width = "60%",
  color = "#a6a6a6",
}: {
  width?: string | number;
  color?: string;
}) {
  return (
    <svg
      viewBox="0 0 480 160"
      width={width}
      role="img"
      aria-label="Getic"
      style={{ display: "block", margin: "0 auto" }}
    >
      <text
        x="10"
        y="138"
        fill={color}
        fontFamily="'Century Gothic', Futura, 'Avenir Next', 'Trebuchet MS', sans-serif"
        fontSize="160"
        fontWeight={500}
        letterSpacing="-4"
      >
        Getic
      </text>
      <text x="440" y="40" fill={color} fontFamily="Arial, sans-serif" fontSize="30">
        ®
      </text>
    </svg>
  );
}
