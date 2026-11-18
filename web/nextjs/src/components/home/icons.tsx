import type { Brand } from "@/lib/brands";
import { BRANDS } from "@/lib/brands";

/** Vela crescent logo mark. Takes its color from `currentColor`. */
function VelaMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"
        fill="currentColor"
      />
    </svg>
  );
}

/** 3×3 grid mark for care. Takes its color from `currentColor`. */
export function CareMark({ className }: { className?: string }) {
  const cells = [0, 7, 14];
  return (
    <svg className={className} viewBox="0 0 18 18" aria-hidden="true">
      <g fill="currentColor">
        {cells.flatMap((y) =>
          cells.map((x) => (
            <rect key={`${x}-${y}`} x={x} y={y} width="4" height="4" rx="1" />
          ))
        )}
      </g>
    </svg>
  );
}

/**
 * The brand's logo for the chat header. Logos are assets rather than tokens, so a brand with
 * its own logo gets a case here; the others show their name.
 */
export function BrandLogo({ brand }: { brand: Brand }) {
  if (brand === "vela") {
    return (
      <div className="flex items-center gap-2.5">
        <VelaMark className="size-5 flex-none" />
        <span className="text-sm font-semibold tracking-[.32em]">VELA</span>
      </div>
    );
  }
  return <span className="text-base font-semibold">{BRANDS[brand].name}</span>;
}
