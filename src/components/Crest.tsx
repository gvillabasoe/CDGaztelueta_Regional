export function Crest({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Escudo */}
      <path
        d="M24 3 43 9v14c0 11.5-7.9 19.2-19 22C12.9 42.2 5 34.5 5 23V9l19-6Z"
        fill="#16233F"
        stroke="#C9A227"
        strokeWidth="2"
      />
      {/* Franja superior dorada */}
      <path
        d="M8 12.5 24 7.5l16 5V17H8v-4.5Z"
        fill="#C9A227"
        opacity="0.9"
      />
      {/* Monograma */}
      <text
        x="24"
        y="31"
        textAnchor="middle"
        fontFamily="var(--font-display), sans-serif"
        fontSize="13"
        fontWeight="700"
        fill="#F1E9D8"
        letterSpacing="0.5"
      >
        CDG
      </text>
    </svg>
  );
}
