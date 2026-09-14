import Image from "next/image";

/** Shared with the browser icon, so every Planora mark has the same drawing. */
export function PlanoraMark({ className }: { className?: string }) {
  return (
    <Image
      src="/icon.svg"
      width={64}
      height={64}
      alt=""
      aria-hidden="true"
      unoptimized
      className={className}
    />
  );
}
