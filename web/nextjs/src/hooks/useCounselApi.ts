import {
  mergeCounselSessionData,
  type CounselInitialMessage,
  type CounselSessionData,
} from "@/lib/counselSessionData";
import type { CreateThreadResponse, ThreadItem } from "@/lib/schemas";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { counselQueryKeys } from "./counselQueryKeys";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CounselApiConfig = {
  /** Counsel user ID */
  counselUserId: string;
  /**
   * When set, calls `${counselDirectApiBase}/…` with Bearer auth (JWT flow).
   * When empty, calls same-origin `/api/counsel/…` with session cookies (API key flow via demo server proxy).
   */
  counselJwt: string;
  /** `${COUNSEL_API_URL}/v1/user` — used only when counselJwt is set */
  counselDirectApiBase: string;
  /** Session data applied to every signed URL from this surface, e.g. `view.navigation`. Per-launch data merges on top of it. */
  baseSessionData?: CounselSessionData;
};

// ---------------------------------------------------------------------------
// Raw fetch helpers
// ---------------------------------------------------------------------------

async function fetchThreadsFromServer(
  config: CounselApiConfig
): Promise<ThreadItem[]> {
  const direct = config.counselJwt.length > 0;
  const url = direct
    ? `${config.counselDirectApiBase}/threads`
    : "/api/counsel/threads";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Idempotency-Key": crypto.randomUUID(),
  };
  if (direct) {
    headers.Authorization = `Bearer ${config.counselJwt}`;
  }
  const resp = await fetch(url, {
    method: "GET",
    headers,
    credentials: direct ? "omit" : "include",
  });
  if (!resp.ok) {
    throw new Error(`Failed to fetch threads: ${resp.status}`);
  }
  const data = await resp.json();
  return data.threads ?? [];
}

async function fetchSignedUrlFromServer(
  config: CounselApiConfig,
  sessionData?: CounselSessionData
): Promise<string> {
  const body = mergeCounselSessionData(config.baseSessionData, sessionData);

  const direct = config.counselJwt.length > 0;
  const endpoint = direct
    ? `${config.counselDirectApiBase}/signedAppUrl`
    : "/api/counsel/signedAppUrl";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Idempotency-Key": crypto.randomUUID(),
  };
  if (direct) {
    headers.Authorization = `Bearer ${config.counselJwt}`;
  }
  const resp = await fetch(endpoint, {
    method: "POST",
    headers,
    credentials: direct ? "omit" : "include",
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    throw new Error(
      `Signed url request failed (${resp.status}): ${await readErrorMessage(resp)}`
    );
  }
  const { url } = await resp.json();
  return url;
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** Pulls the API's message off a failed response, which is where a refusal says why — e.g. a module the organization can't open. */
async function readErrorMessage(resp: Response): Promise<string> {
  const text = (await resp.text()).trim();
  if (!text) return resp.statusText;
  const parsed = safeJsonParse(text);
  if (parsed && typeof parsed === "object" && "message" in parsed) {
    const { message } = parsed as { message?: unknown };
    if (typeof message === "string") return message;
  }
  return text;
}

// ---------------------------------------------------------------------------
// Create thread
// ---------------------------------------------------------------------------

export type CreateThreadParams = {
  module?: string;
  initial_messages?: CounselInitialMessage[];
  agent_context?: Record<string, unknown>;
};

async function createThreadOnServer(
  config: CounselApiConfig,
  params: CreateThreadParams
): Promise<CreateThreadResponse> {
  const direct = config.counselJwt.length > 0;
  const url = direct
    ? `${config.counselDirectApiBase}/threads`
    : "/api/counsel/threads";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Idempotency-Key": crypto.randomUUID(),
  };
  if (direct) {
    headers.Authorization = `Bearer ${config.counselJwt}`;
  }
  const resp = await fetch(url, {
    method: "POST",
    headers,
    credentials: direct ? "omit" : "include",
    body: JSON.stringify(params),
  });
  if (!resp.ok) {
    throw new Error(`Failed to create thread: ${resp.status}`);
  }
  return resp.json();
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/**
 * Fetches Counsel threads via react-query and provides optimistic update
 * helpers for sidebar management.
 */
export function useCounselThreads(
  config: CounselApiConfig,
  options?: { enabled?: boolean }
) {
  const queryClient = useQueryClient();
  const queryKey = counselQueryKeys.threads(config.counselUserId);

  const {
    data: threads = [],
    isLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn: () => fetchThreadsFromServer(config),
    enabled: !!config.counselUserId && options?.enabled !== false,
  });

  const addThread = useCallback(
    (thread: ThreadItem) => {
      queryClient.setQueryData<ThreadItem[]>(queryKey, (old = []) => [
        thread,
        ...old,
      ]);
    },
    [queryClient, queryKey]
  );

  /** Marks the threads query stale and triggers a background refetch. */
  const invalidateThreads = useCallback(() => {
    return queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  return { threads, isLoading, error, addThread, invalidateThreads };
}

/**
 * Returns a `getSignedUrl` function backed by react-query's useMutation,
 * along with an `isPending` flag.
 */
export function useCounselSignedUrl(config: CounselApiConfig) {
  const { mutateAsync, isPending } = useMutation({
    mutationFn: (sessionData?: CounselSessionData) =>
      fetchSignedUrlFromServer(config, sessionData),
  });

  return { getSignedUrl: mutateAsync, isPending };
}

/**
 * Returns a `createThread` function that creates a thread via the Counsel API,
 * then returns the thread_id. Use this before calling `getSignedUrl` with
 * `open_thread` to load the iframe faster.
 */
export function useCounselCreateThread(config: CounselApiConfig) {
  const { mutateAsync, isPending } = useMutation({
    mutationFn: (params: CreateThreadParams) =>
      createThreadOnServer(config, params),
  });

  return { createThread: mutateAsync, isPending };
}

/**
 * Eagerly fetches a base signed URL on mount (no action) so the Counsel iframe
 * can be pre-warmed before the user triggers a Counsel interaction. Uses
 * `useQuery` so the fetch is fire-and-forget — it does NOT contribute to any
 * `isPending` flag that would disable the sidebar or show a loading state.
 */
export function useCounselPreloadSignedUrl(config: CounselApiConfig) {
  const { data } = useQuery({
    queryKey: counselQueryKeys.preloadedSignedUrl(
      config.counselUserId,
      config.baseSessionData
    ),
    queryFn: () => fetchSignedUrlFromServer(config),
    enabled: !!config.counselUserId,
    // Signed URLs are valid for ~1 hour; treat as fresh for 50 min
    staleTime: 50 * 60 * 1000,
    // Never refetch in the background — a new URL would change effectiveSignedUrl,
    // remounting the iframe via key={signedAppUrl} and interrupting an active session.
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    // Don't retry — a failed preload is non-blocking; the user flow will fetch when needed
    retry: false,
  });

  return data ?? null;
}
