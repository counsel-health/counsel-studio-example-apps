/** Brand skins for the home page, its sample data, and the Counsel session data it opens with. */

import type { CounselSessionData } from "./counselSessionData";

/**
 * Brand skins under `src/styles/themes`, set with `data-theme`. The first one is the default.
 * `example` is a made-up skin that shows a reskin is tokens only.
 */
export const BRANDS = {
  studio: { name: "Studio Demo" },
  vela: { name: "Vela" },
  example: { name: "Example" },
} as const;

export type Brand = keyof typeof BRANDS;

const BRAND_IDS = Object.keys(BRANDS) as Brand[];

/** Reads `?theme=` and falls back to the default brand for anything unknown. */
export function parseBrand(value: string | string[] | undefined): Brand {
  const theme = Array.isArray(value) ? value[0] : value;
  return BRAND_IDS.find((b) => b === theme) ?? BRAND_IDS[0];
}

/** Sample resting heart rate for the last 7 days, oldest first. The last day is today. */
export const RESTING_HEART_RATE = {
  unit: "bpm",
  usualBpm: 64,
  days: [
    { day: "Wed", bpm: 64 },
    { day: "Thu", bpm: 65 },
    { day: "Fri", bpm: 64 },
    { day: "Sat", bpm: 66 },
    { day: "Sun", bpm: 67 },
    { day: "Mon", bpm: 68 },
    { day: "Tue", bpm: 70 },
  ],
} as const;

/** Maps values linearly onto bar heights in px, lowest value to `minPx` and highest to `maxPx`. */
export function getBarHeights(
  values: readonly number[],
  minPx: number,
  maxPx: number
): number[] {
  const low = Math.min(...values);
  const range = Math.max(...values) - low;
  return values.map((v) =>
    range === 0
      ? maxPx
      : Math.round(minPx + ((v - low) / range) * (maxPx - minPx))
  );
}

/**
 * Opens straight into a conversation with the host's chrome around it, and gives the AI the same
 * heart rate the home page shows so the user can ask about it without repeating it.
 */
export function getHomeSessionData(brand: Brand): CounselSessionData {
  return {
    action: { action: "start_thread" },
    view: { navigation: "integrated" },
    metadata: { app_name: BRANDS[brand].name },
    agent_context: {
      resting_heart_rate: {
        unit: RESTING_HEART_RATE.unit,
        usual_bpm: RESTING_HEART_RATE.usualBpm,
        last_7_days: RESTING_HEART_RATE.days,
      },
    },
  };
}
