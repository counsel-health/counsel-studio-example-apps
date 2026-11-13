import { cn } from "@/lib/utils";

/** Vela crescent logo mark. Takes its color from `currentColor`. */
export function VelaMark({ className }: { className?: string }) {
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

/** Vela logo with wordmark. `compact` is the smaller size used in the chat header. */
export function VelaBrand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <VelaMark
        className={cn("flex-none", compact ? "size-5" : "size-[22px]")}
      />
      <span
        className={cn(
          "font-semibold tracking-[.32em]",
          compact ? "text-sm" : "text-[15px]"
        )}
      >
        VELA
      </span>
    </div>
  );
}
