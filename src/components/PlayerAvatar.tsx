// Muestra la foto del jugador o, si no hay, sus iniciales.
export function PlayerAvatar({
  photo,
  firstName,
  lastName,
  size = 40,
}: {
  photo: string | null;
  firstName: string;
  lastName: string;
  size?: number;
}) {
  const initials =
    (firstName?.[0] ?? "").toUpperCase() + (lastName?.[0] ?? "").toUpperCase();
  if (photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photo}
        alt={`${firstName} ${lastName}`}
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className="shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <span
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      className="flex shrink-0 items-center justify-center rounded-full bg-marino font-display font-semibold text-beige"
    >
      {initials || "?"}
    </span>
  );
}
