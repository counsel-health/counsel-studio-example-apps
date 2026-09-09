import type {
  CounselChatModule,
  CounselInitialMessage,
  CounselSessionData,
  CounselSessionView,
  CounselThreadMetadata,
} from "@/lib/counselSessionData";
import {
  COUNSEL_MODULE_OPTIONS,
  getCounselSessionSeedOption,
  type CounselSessionActionKind,
  type CounselSessionSeed,
} from "@/lib/counselSessionOptions";

/** A playground selection, before it becomes a session data body. */
export type CounselSessionParams = {
  action: CounselSessionActionKind;
  module: CounselChatModule;
  seed: CounselSessionSeed;
  theme: "" | NonNullable<CounselSessionView["theme"]>;
  navigation: "" | NonNullable<CounselSessionView["navigation"]>;
  threadId: string;
};

export const DEFAULT_COUNSEL_SESSION_PARAMS: CounselSessionParams = {
  action: "start_thread",
  module: "get_care",
  seed: "none",
  theme: "",
  navigation: "",
  threadId: "",
};

/** True when the action's payload is built from the module and seed choices. */
export function isThreadStartingAction(
  action: CounselSessionActionKind
): boolean {
  return action === "start_thread" || action === "create_thread";
}

/** Turns a selection into the session data body for `POST /v1/user/signedAppUrl`. */
export function buildCounselSessionData(
  params: CounselSessionParams
): CounselSessionData {
  const data: CounselSessionData = {};
  const seed = getCounselSessionSeedOption(params.seed);
  const seeded: {
    initial_messages?: CounselInitialMessage[];
    metadata?: CounselThreadMetadata;
  } = {
    ...(seed.initialMessages ? { initial_messages: seed.initialMessages } : {}),
    ...(seed.metadata ? { metadata: seed.metadata } : {}),
  };

  switch (params.action) {
    case "start_thread":
      data.action = {
        action: "start_thread",
        module: params.module,
        ...seeded,
      };
      break;
    case "create_thread":
      data.action = {
        action: "create_thread",
        module: params.module,
        ...seeded,
      };
      break;
    case "open_thread":
      data.action = { action: "open_thread", thread_id: params.threadId };
      break;
    case "open_page":
      data.action = { action: "open_page", page: "consents" };
      break;
    case "none":
      break;
  }

  if (isThreadStartingAction(params.action) && seed.agentContext) {
    data.agent_context = seed.agentContext;
  }

  const view: CounselSessionView = {};
  if (params.theme) view.theme = params.theme;
  if (params.navigation) view.navigation = params.navigation;
  if (Object.keys(view).length > 0) data.view = view;

  return data;
}

/** What the launch does to the user's threads: a label for the badge, and a sentence explaining it. */
export type CounselSessionEffect = { label: string; detail: string };

export function describeCounselSessionEffect(
  params: CounselSessionParams
): CounselSessionEffect {
  const moduleLabel =
    COUNSEL_MODULE_OPTIONS.find((item) => item.value === params.module)
      ?.label ?? params.module;
  const messageCount =
    getCounselSessionSeedOption(params.seed).initialMessages?.length ?? 0;

  if (isThreadStartingAction(params.action)) {
    if (messageCount > 0) {
      return {
        label: "New thread",
        detail: `Starts a ${moduleLabel} thread carrying ${messageCount} message${messageCount === 1 ? "" : "s"}. Initial messages always start a new thread, so nothing is reused.`,
      };
    }
    return {
      label: "New or reused thread",
      detail: `Opens ${moduleLabel} with an empty conversation. With no initial messages Counsel can hand back a thread the user never replied to instead of starting another one.`,
    };
  }

  switch (params.action) {
    case "open_thread":
      return {
        label: "Existing thread",
        detail: "Opens the thread you picked. Nothing is created.",
      };
    case "open_page":
      return {
        label: "No thread",
        detail:
          "Opens the consents page where your organization has it enabled. Otherwise the app opens chat.",
      };
    default:
      return {
        label: "Counsel decides",
        detail:
          "Sends no action, so Counsel chooses what to show the user itself.",
      };
  }
}
