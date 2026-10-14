import type {
  CounselChatModule,
  CounselInitialMessage,
  CounselThreadMetadata,
} from "@/lib/counselSessionData";

/** The choices the playground offers, in the order it presents them: the action, the module it opens, and what the thread starts from. */

export type CounselSessionActionKind =
  | "none"
  | "start_thread"
  | "create_thread"
  | "open_thread"
  | "open_page";

export const COUNSEL_SESSION_ACTION_OPTIONS: {
  value: CounselSessionActionKind;
  label: string;
  description: string;
  /** Shown in place of the fields, for actions that have none to configure. */
  note?: string;
}[] = [
  {
    value: "start_thread",
    label: "start_thread",
    description:
      "Opens a thread in a module. The one to reach for in a new integration.",
  },
  {
    value: "create_thread",
    label: "create_thread",
    description:
      "The other thread-starting action, taking the same fields as start_thread.",
  },
  {
    value: "open_thread",
    label: "open_thread",
    description: "Opens one of the user's existing threads by ID.",
  },
  {
    value: "open_page",
    label: "open_page",
    description: "Opens a standalone page instead of a thread.",
    note: "Pages are enabled per organization. Where consents isn't enabled the signed url is still issued, and the app opens chat instead.",
  },
  {
    value: "none",
    label: "none",
    description: "Sends no action, so the Counsel app decides where to land.",
    note: "Nothing to configure. This is the body an integration sends when it wants Counsel to pick the entry point.",
  },
];

export const COUNSEL_MODULE_OPTIONS: {
  value: CounselChatModule;
  label: string;
}[] = [
  { value: "get_care", label: "Get Care" },
  { value: "get_advice", label: "Get Advice" },
  { value: "refill_medication", label: "Refill Medication" },
  { value: "review_my_results", label: "Review Results" },
  { value: "order_lab", label: "Order Lab" },
];

export type CounselSessionSeed = "none" | "patient_message" | "ai_handoff";

export type CounselSessionSeedOption = {
  value: CounselSessionSeed;
  label: string;
  description: string;
  initialMessages?: CounselInitialMessage[];
  agentContext?: Record<string, unknown>;
  metadata?: CounselThreadMetadata;
};

export const COUNSEL_SESSION_SEED_OPTIONS: CounselSessionSeedOption[] = [
  {
    value: "none",
    label: "Nothing",
    description: "The user starts the conversation themselves.",
  },
  {
    value: "patient_message",
    label: "One message from the user",
    description: "The thread opens with their message already in it.",
    initialMessages: [
      {
        body: "I need to speak to someone about a rash on my arm.",
        role: "patient",
      },
    ],
  },
  {
    value: "ai_handoff",
    label: "A handoff from your assistant",
    description:
      "Transcript, why you escalated, and your own IDs for correlation.",
    initialMessages: [
      {
        body: "I've had a sore throat and a fever for two days and it isn't getting better.",
        role: "patient",
      },
      {
        body: "That sounds worth having a clinician look at. Connecting you to Counsel now.",
        role: "model",
      },
    ],
    agentContext: {
      reason_for_handoff: "Sore throat and fever for 48 hours, not improving",
      host_app: "Studio Demo",
    },
    metadata: {
      external_session_id: "demo-session-4821",
      plan: "pro",
    },
  },
];

export function getCounselSessionSeedOption(
  seed: CounselSessionSeed
): CounselSessionSeedOption {
  const option = COUNSEL_SESSION_SEED_OPTIONS.find(
    (item) => item.value === seed
  );
  if (!option) {
    throw new Error(`Unknown Counsel session seed: ${seed}`);
  }
  return option;
}
