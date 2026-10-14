import { describe, expect, test } from "vitest";
import {
  DEFAULT_CHAT_SESSION_DATA,
  mergeCounselSessionData,
} from "../counselSessionData";
import {
  buildCounselSessionData,
  DEFAULT_COUNSEL_SESSION_PARAMS,
  describeCounselSessionEffect,
} from "../counselSessionParams";

describe("mergeCounselSessionData", () => {
  test("returns an empty body when neither side is set", () => {
    expect(mergeCounselSessionData(undefined, undefined)).toEqual({});
  });

  test("keeps the base view and layers per-launch view keys on top", () => {
    const merged = mergeCounselSessionData(
      { view: { navigation: "integrated" } },
      { view: { theme: "dark" } }
    );
    expect(merged.view).toEqual({ navigation: "integrated", theme: "dark" });
  });

  test("an explicit undefined in the overlay doesn't erase the base value", () => {
    const merged = mergeCounselSessionData(
      { view: { navigation: "integrated" } },
      { view: { navigation: undefined, theme: "light" } }
    );
    expect(merged.view).toEqual({ navigation: "integrated", theme: "light" });
  });

  test("replaces the action wholesale instead of mixing fields", () => {
    const merged = mergeCounselSessionData(
      {
        action: {
          action: "start_thread",
          module: "get_care",
          initial_messages: [{ body: "hi" }],
        },
      },
      { action: { action: "open_thread", thread_id: "t-1" } }
    );
    expect(merged.action).toEqual({ action: "open_thread", thread_id: "t-1" });
  });

  test("merges agent_context key by key", () => {
    const merged = mergeCounselSessionData(
      { agent_context: { host_app: "Studio Demo" } },
      { agent_context: { reason_for_handoff: "fever" } }
    );
    expect(merged.agent_context).toEqual({
      host_app: "Studio Demo",
      reason_for_handoff: "fever",
    });
  });
});

describe("buildCounselSessionData", () => {
  test("defaults to an unseeded start_thread with no view", () => {
    expect(buildCounselSessionData(DEFAULT_COUNSEL_SESSION_PARAMS)).toEqual({
      action: { action: "start_thread", module: "get_care" },
    });
  });

  test("a handoff seed carries messages, thread metadata and agent_context", () => {
    const data = buildCounselSessionData({
      ...DEFAULT_COUNSEL_SESSION_PARAMS,
      action: "create_thread",
      seed: "ai_handoff",
    });
    expect(data.action).toMatchObject({
      action: "create_thread",
      module: "get_care",
      metadata: { external_session_id: "demo-session-4821" },
    });
    expect(
      data.action && "initial_messages" in data.action
        ? data.action.initial_messages
        : []
    ).toHaveLength(2);
    expect(data.agent_context).toMatchObject({
      reason_for_handoff: expect.any(String),
    });
  });

  test("agent_context is only sent with thread-starting actions", () => {
    const data = buildCounselSessionData({
      ...DEFAULT_COUNSEL_SESSION_PARAMS,
      action: "open_thread",
      seed: "ai_handoff",
      threadId: "t-1",
    });
    expect(data).toEqual({
      action: { action: "open_thread", thread_id: "t-1" },
    });
  });

  test("none sends no action, only the view that was set", () => {
    expect(
      buildCounselSessionData({
        ...DEFAULT_COUNSEL_SESSION_PARAMS,
        action: "none",
        theme: "dark",
      })
    ).toEqual({ view: { theme: "dark" } });
  });
});

describe("describeCounselSessionEffect", () => {
  test("warns that an unseeded thread-starting action can reuse a thread", () => {
    expect(
      describeCounselSessionEffect(DEFAULT_COUNSEL_SESSION_PARAMS).label
    ).toBe("New or reused thread");
  });

  test("seeded actions always start a new thread", () => {
    expect(
      describeCounselSessionEffect({
        ...DEFAULT_COUNSEL_SESSION_PARAMS,
        seed: "patient_message",
      }).label
    ).toBe("New thread");
  });
});

describe("DEFAULT_CHAT_SESSION_DATA", () => {
  test("opens chat with start_thread, the same action the playground defaults to", () => {
    expect(DEFAULT_CHAT_SESSION_DATA.action?.action).toBe("start_thread");
    expect(DEFAULT_COUNSEL_SESSION_PARAMS.action).toBe("start_thread");
  });
});
