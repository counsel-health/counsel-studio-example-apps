import type { ThreadItem } from "@/lib/schemas";
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
};

export type InitialMessage = { body: string; role: "patient" | "model" };

type SignedUrlAction =
  | { action: "open_thread"; thread_id: string }
  | {
      action: "create_thread";
      initial_messages?: InitialMessage[];
      agent_context?: Record<string, unknown>;
    }
  | {
      action: "start_thread";
      module?: string;
      initial_messages?: InitialMessage[];
      metadata?: Record<string, unknown>;
      agent_context?: Record<string, unknown>;
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
  action?: SignedUrlAction
): Promise<string> {
  const sessionData: Record<string, unknown> = {
    view: { navigation: "integrated" },
  };
  if (action) {
    // Counsel signedAppUrl expects a single `action` object. For create_thread,
    // initial_messages and agent_context must live on that object (not on sessionData).
    if (action.action === "create_thread") {
      sessionData.action = {
        action: "create_thread",
        initial_messages: action.initial_messages,
        agent_context: action.agent_context,
      };
    } else if (action.action === "start_thread") {
      // start_thread has no agent_context field; Counsel reads it from sessionData.
      const { agent_context, ...startThread } = action;
      sessionData.action = startThread;
      if (agent_context) sessionData.agent_context = agent_context;
    } else {
      sessionData.action = action;
    }
  }

  const direct = config.counselJwt.length > 0;
  const signedUrlEndpoint = direct
    ? `${config.counselDirectApiBase}/signedAppUrl`
    : "/api/counsel/signedAppUrl";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Idempotency-Key": crypto.randomUUID(),
  };
  if (direct) {
    headers.Authorization = `Bearer ${config.counselJwt}`;
  }
  const resp = await fetch(signedUrlEndpoint, {
    method: "POST",
    headers,
    credentials: direct ? "omit" : "include",
    body: JSON.stringify(sessionData),
  });
  if (!resp.ok) {
    throw new Error(`Failed to fetch signed URL: ${resp.status}`);
  }
  const { url } = await resp.json();
  return url;
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/**
 * Fetches Counsel threads via react-query and provides optimistic update
 * helpers for sidebar management.
 */
export function useCounselThreads(config: CounselApiConfig) {
  const queryClient = useQueryClient();
  const queryKey = counselQueryKeys.threads(config.counselUserId);

  const {
    data: threads = [],
    isLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn: () => fetchThreadsFromServer(config),
    enabled: !!config.counselUserId,
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

  const replaceThread = useCallback(
    (id: string, thread: ThreadItem) => {
      queryClient.setQueryData<ThreadItem[]>(queryKey, (old = []) =>
        old.map((t) => (t.id === id ? thread : t))
      );
    },
    [queryClient, queryKey]
  );

  /** Marks the threads query stale and triggers a background refetch. */
  const invalidateThreads = useCallback(() => {
    return queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  return {
    threads,
    isLoading,
    error,
    addThread,
    replaceThread,
    invalidateThreads,
  };
}

/**
 * Returns a `getSignedUrl` function backed by react-query's useMutation,
 * along with an `isPending` flag.
 */
export function useCounselSignedUrl(config: CounselApiConfig) {
  const { mutateAsync, isPending } = useMutation({
    mutationFn: (action?: SignedUrlAction) =>
      fetchSignedUrlFromServer(config, action),
  });

  return { getSignedUrl: mutateAsync, isPending };
}

/**
 * Eagerly fetches a base signed URL on mount (no action) so the Counsel iframe
 * can be pre-warmed before the user triggers a Counsel interaction. Uses
 * `useQuery` so the fetch is fire-and-forget — it does NOT contribute to any
 * `isPending` flag that would disable the sidebar or show a loading state.
 */
export function useCounselPreloadSignedUrl(config: CounselApiConfig) {
  const { data } = useQuery({
    queryKey: counselQueryKeys.preloadedSignedUrl(config.counselUserId),
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
