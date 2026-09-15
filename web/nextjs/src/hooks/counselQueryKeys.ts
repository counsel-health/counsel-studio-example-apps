import type { CounselSessionData } from "@/lib/counselSessionData";

export const counselQueryKeys = {
  threads: (userId: string) => ["counsel", "threads", userId] as const,
  // Keyed on the base session data so an integrated URL isn't reused by a standalone surface.
  preloadedSignedUrl: (userId: string, baseSessionData?: CounselSessionData) =>
    ["counsel", "preloadedSignedUrl", userId, baseSessionData ?? null] as const,
};
