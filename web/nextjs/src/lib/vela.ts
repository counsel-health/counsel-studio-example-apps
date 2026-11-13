/** Sample data and Counsel session data for the Vela partner demo at `/vela`. */

import type { CounselSessionData } from "./counselSessionData";

/** Partner skins under `src/components/vela/themes`. The first one is the default. */
export const VELA_THEMES = ["vela", "example"] as const;

export type VelaTheme = (typeof VELA_THEMES)[number];

/** Reads `?theme=` and falls back to the default skin for anything unknown. */
export function parseVelaTheme(
  value: string | string[] | undefined
): VelaTheme {
  const theme = Array.isArray(value) ? value[0] : value;
  return VELA_THEMES.find((t) => t === theme) ?? VELA_THEMES[0];
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
 * heart rate the home screen shows so the user can ask about it without repeating it.
 */
export const VELA_SESSION_DATA: CounselSessionData = {
  action: { action: "start_thread" },
  view: { navigation: "integrated" },
  metadata: { app_name: "Vela" },
  agent_context: {
    resting_heart_rate: {
      unit: RESTING_HEART_RATE.unit,
      usual_bpm: RESTING_HEART_RATE.usualBpm,
      last_7_days: RESTING_HEART_RATE.days,
    },
  },
};
