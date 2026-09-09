/** Types for the session data body of `POST /v1/user/signedAppUrl`, which tells the Counsel app what to show when the signed url opens. */

/** Module aliases accepted by the public API. Which ones are available is configured per organization. */
export type CounselChatModule =
  | "get_care"
  | "get_advice"
  | "refill_medication"
  | "review_my_results"
  | "order_lab";

export type CounselInitialMessage = {
  body: string;
  /** Defaults to `patient` when omitted. `model` renders as a message from Counsel. */
  role?: "patient" | "model";
};

/** Your own identifiers to carry onto the thread. Keys and values are short strings — see the API reference for current limits. */
export type CounselThreadMetadata = Record<string, string | number | boolean>;

/** Opens a thread in a module, optionally preloaded with messages. The action to reach for in a new integration. */
export type CounselStartThreadAction = {
  action: "start_thread";
  module?: CounselChatModule;
  initial_messages?: CounselInitialMessage[];
  metadata?: CounselThreadMetadata;
};

/** The other accepted thread-starting action. Takes the same fields as `start_thread`. */
export type CounselCreateThreadAction = {
  action: "create_thread";
  module?: CounselChatModule;
  initial_messages?: CounselInitialMessage[];
  metadata?: CounselThreadMetadata;
};

export type CounselOpenThreadAction = {
  action: "open_thread";
  thread_id: string;
};

export type CounselOpenPageAction = {
  action: "open_page";
  page: "consents";
};

export type CounselSessionAction =
  | CounselStartThreadAction
  | CounselCreateThreadAction
  | CounselOpenThreadAction
  | CounselOpenPageAction;

export const COUNSEL_THEMES = ["light", "dark", "system"] as const;

/** `integrated` renders messages and input only — no Counsel sidebar or nav. */
export const COUNSEL_NAVIGATIONS = ["standalone", "integrated"] as const;

export type CounselSessionView = {
  theme?: (typeof COUNSEL_THEMES)[number];
  navigation?: (typeof COUNSEL_NAVIGATIONS)[number];
};

export type CounselSessionData = {
  action?: CounselSessionAction;
  view?: CounselSessionView;
  /** Identifies the app the session was launched from. */
  metadata?: { app_name?: string };
  /** Free-form context for the AI. A sibling of `action`, not a field inside it. */
  agent_context?: Record<string, unknown>;
};

/** Merges `view`, `metadata`, and `agent_context` key by key. `action` is replaced wholesale, since its fields depend on each other. */
export function mergeCounselSessionData(
  base: CounselSessionData | undefined,
  overlay: CounselSessionData | undefined
): CounselSessionData {
  const b = base ?? {};
  const o = overlay ?? {};
  const merged: CounselSessionData = { ...b };
  if (o.action !== undefined) merged.action = o.action;
  if (o.view !== undefined) merged.view = { ...b.view, ...o.view };
  if (o.metadata !== undefined)
    merged.metadata = { ...b.metadata, ...o.metadata };
  if (o.agent_context !== undefined) {
    merged.agent_context = { ...b.agent_context, ...o.agent_context };
  }
  return merged;
}
