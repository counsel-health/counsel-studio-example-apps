import { useCallback, useEffect, useMemo, useRef, type RefObject } from "react";

/**
 * Outbound message types accepted by the Counsel iframe.
 * Source of truth: See Counsel API documentation.
 */
type SwitchThreadMessage = {
  type: "switch_thread";
  thread_id: string;
};

type CounselOutboundMessage = SwitchThreadMessage;

/**
 * Inbound message types emitted by the Counsel iframe.
 */
export type CounselInboundMessage =
  | { type: "counsel:thread_created"; thread_id: string }
  /** Sent once the embedded page has finished loading. */
  | { type: "counsel:ready" };

type SendOptions = {
  iframeRef: RefObject<HTMLIFrameElement | null>;
  iframeOrigin: string | null;
};

/**
 * Returns stable send-helpers for communicating with the Counsel iframe
 * via postMessage. Add new methods here as the Counsel Studio message
 * interface expands.
 *
 * `iframeOrigin` is passed to `postMessage` as the `targetOrigin` argument so
 * messages are never broadcast with `"*"`.
 */
export function useCounselAppMessageHandler({
  iframeRef,
  iframeOrigin,
}: SendOptions) {
  const sendMessage = useCallback(
    (message: CounselOutboundMessage) => {
      if (!iframeRef.current?.contentWindow || !iframeOrigin) return;
      iframeRef.current.contentWindow.postMessage(message, iframeOrigin);
    },
    [iframeRef, iframeOrigin]
  );

  const switchThread = useCallback(
    (threadId: string) => {
      sendMessage({ type: "switch_thread", thread_id: threadId });
    },
    [sendMessage]
  );

  return { switchThread };
}

/** The origin a signed url points at, which is what both message hooks check against. Null until there is a url to read it from. */
export function useCounselIframeOrigin(
  signedAppUrl: string | null
): string | null {
  return useMemo(() => {
    if (!signedAppUrl) return null;
    try {
      return new URL(signedAppUrl).origin;
    } catch {
      return null;
    }
  }, [signedAppUrl]);
}

type InboundOptions = {
  /**
   * The origin Counsel signed the URL for (e.g. `https://app.counselhealth.com`).
   * Inbound messages from any other origin are dropped.
   */
  iframeOrigin: string | null;
  onMessage: (message: CounselInboundMessage) => void;
};

/**
 * Subscribes to `message` events from the Counsel iframe with origin validation.
 *
 * Any host page that renders the Counsel iframe SHOULD use this hook (or
 * replicate the same `event.origin === iframeOrigin` check) before reading
 * `event.data`. Without that check, any other iframe on the page can spoof
 * Counsel events.
 */
export function useCounselInboundMessages({
  iframeOrigin,
  onMessage,
}: InboundOptions) {
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!iframeOrigin) return;

    const handler = (event: MessageEvent) => {
      if (event.origin !== iframeOrigin) return;
      const data = event.data;
      if (!data || typeof data !== "object") return;
      if (typeof (data as { type?: unknown }).type !== "string") return;
      onMessageRef.current(data as CounselInboundMessage);
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [iframeOrigin]);
}
