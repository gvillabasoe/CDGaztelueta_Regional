// Escudo oficial del CD Gaztelueta (imagen real, nunca redibujada).
// Usa el escudo personalizado por el entrenador si existe; si no, /escudo.jpg.
export function Crest({
  size = 36,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/api/team-image/crest"
      alt="Escudo del CD Gaztelueta"
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={"rounded-lg object-cover " + className}
    />
  );
}
