function initials(name: string): string {
  const words = name
    .replace(/[^\p{L}\p{N} ]/gu, "")
    .split(" ")
    .filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function TeamBadge({
  name,
  isOwn,
  size = 40,
}: {
  name: string;
  isOwn: boolean;
  size?: number;
}) {
  return (
    <span
      className={
        "inline-flex shrink-0 items-center justify-center rounded-full font-display font-semibold " +
        (isOwn
          ? "bg-marino text-beige ring-2 ring-dorado"
          : "bg-beige text-marino ring-1 ring-gris/30")
      }
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}
