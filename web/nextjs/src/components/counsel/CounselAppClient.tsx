"use client";

import { useCounselAppMessageHandler } from "@/hooks/useCounselAppMessageHandler";
import { useEffect, useRef } from "react";

export type CounselAppClientProps = {
  signedAppUrl: string;
  className?: string;
  /**
   * When this changes after initial mount, sends a `switch_thread` postMessage
   * to the iframe so it navigates without a full reload.
   * Must be a real Counsel thread UUID — not a client-side placeholder ID.
   */
  currentThreadId?: string;
};

/**
 * CounselAppClient renders the Counsel app inside an iframe.
 * Use the `currentThreadId` prop to switch between threads without reloading.
 */
export default function CounselAppClient({
  signedAppUrl,
  className,
  currentThreadId,
}: CounselAppClientProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isFirstRender = useRef(true);

  const iframeOrigin = (() => {
    try {
      return new URL(signedAppUrl).origin;
    } catch {
      return null;
    }
  })();

  const { switchThread } = useCounselAppMessageHandler({
    iframeRef,
    iframeOrigin,
  });

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!currentThreadId) return;
    switchThread(currentThreadId);
  }, [currentThreadId, switchThread]);

  return (
    <iframe
      ref={iframeRef}
      title="Counsel App"
      src={signedAppUrl}
      className={className}
      sandbox="allow-storage-access-by-user-activation allow-same-origin allow-scripts allow-forms allow-downloads allow-popups"
      allow="clipboard-read; clipboard-write"
    />
  );
}
