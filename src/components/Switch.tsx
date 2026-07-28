"use client";

export function Switch({
  checked,
  onChange,
  label,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  id?: string;
}) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors " +
        (checked ? "bg-dorado" : "bg-gris/40")
      }
    >
      <span
        className={
          "inline-block h-5 w-5 transform rounded-full bg-blanco shadow transition-transform " +
          (checked ? "translate-x-[22px]" : "translate-x-[2px]")
        }
      />
    </button>
  );
}
