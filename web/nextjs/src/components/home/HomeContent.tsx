import type { Ref } from "react";
import { ChevronRight } from "lucide-react";
import { getBarHeights, RESTING_HEART_RATE } from "@/lib/brands";
import { cn } from "@/lib/utils";
import { CareMark } from "./icons";

const TILES = [
  { title: "Sleep", value: "[0h 00m]", note: "Last night" },
  { title: "Readiness", value: "[00]", note: "Score today" },
  { title: "Activity", value: "[0,000]", note: "Steps so far" },
];

type HomeContentProps = {
  getCareRef: Ref<HTMLButtonElement>;
  onGetCare: () => void;
};

/** Home: greeting, the "Get care" entry point, resting heart rate and today's tiles. */
export default function HomeContent({
  getCareRef,
  onGetCare,
}: HomeContentProps) {
  return (
    <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-8 px-12 pt-8 pb-30 max-sm:px-5 max-sm:pt-6">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <header className="flex flex-col gap-1.5">
          <h1 className="font-(family-name:--font-display) text-[44px] leading-[1.1] font-normal tracking-[-0.01em]">
            Good morning, Nora
          </h1>
          <p className="text-[17px] text-(--app-text-muted)">
            Tuesday, October 14
          </p>
        </header>
        <button
          ref={getCareRef}
          type="button"
          onClick={onGetCare}
          className="flex h-12 cursor-pointer items-center gap-3 rounded-(--care-radius) bg-(--care-bg) py-1 pr-4 pl-1 text-left text-(--care-text) shadow-(--care-shadow) transition-[translate,box-shadow] duration-160 ease-[ease] hover:-translate-y-px hover:shadow-(--care-shadow-hover) motion-reduce:transition-none motion-reduce:hover:translate-y-0"
        >
          <span className="flex size-10 flex-none items-center justify-center rounded-full bg-(--care-icon-bg) text-(--care-mark)">
            <CareMark className="size-[18px]" />
          </span>
          <span className="text-base font-semibold">Get care</span>
          <ChevronRight
            className="size-4 text-(--care-muted)"
            aria-hidden="true"
          />
        </button>
      </div>

      <HeartRateCard />

      <section
        className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-5"
        aria-label="Today"
      >
        {TILES.map((tile) => (
          <div
            key={tile.title}
            className="flex flex-col gap-2.5 rounded-(--app-radius-card) bg-(--app-surface) px-7 py-6"
          >
            <h2 className="text-[15px] font-semibold text-(--app-text-subtle)">
              {tile.title}
            </h2>
            <span className="font-(family-name:--font-display) text-4xl leading-none">
              {tile.value}
            </span>
            <span className="text-sm text-(--app-text-muted)">{tile.note}</span>
          </div>
        ))}
      </section>
    </div>
  );
}

function HeartRateCard() {
  const { days, unit, usualBpm } = RESTING_HEART_RATE;
  const today = days[days.length - 1];
  const change = today.bpm - usualBpm;
  const heights = getBarHeights(
    days.map((d) => d.bpm),
    70,
    116
  );

  return (
    <section
      className="flex flex-col gap-6 rounded-(--app-radius-card) bg-(--app-surface) px-8 py-7"
      aria-label="Resting heart rate trend"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h2 className="text-lg font-semibold">Resting heart rate</h2>
        <span className="text-[15px] text-(--app-text-muted)">Last 7 days</span>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-8">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline gap-2">
            <span className="font-(family-name:--font-display) text-[64px] leading-none">
              {today.bpm}
            </span>
            <span className="text-lg text-(--app-text-muted)">{unit}</span>
          </div>
          <span className="text-base text-(--app-text-muted)">
            {change === 0
              ? "Same as your usual."
              : `${change > 0 ? "Up" : "Down"} ${Math.abs(change)} ${unit} from your usual.`}
          </span>
        </div>
        <div
          className="flex h-[140px] items-end gap-3.5"
          role="img"
          aria-label={`Bar chart: resting heart rate over the last 7 days, ${today.bpm} ${unit} today`}
        >
          {days.map((d, i) => (
            <div key={d.day} className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  "w-7 rounded-md",
                  d === today ? "bg-(--app-chart-current)" : "bg-(--app-chart)"
                )}
                // Data-driven height is the one inline style the styling contract allows.
                style={{ height: heights[i] }}
              />
              <span className="text-xs text-(--app-text-muted)">{d.day}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
