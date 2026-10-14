"use client";

import { CounselApp } from "@/components/counsel/CounselApp";
import { Button } from "@/components/ui/button";
import {
  useCounselSignedUrl,
  useCounselThreads,
  type CounselApiConfig,
} from "@/hooks/useCounselApi";
import {
  useCounselIframeOrigin,
  useCounselInboundMessages,
} from "@/hooks/useCounselAppMessageHandler";
import { clientLogger } from "@/lib/clientLogger";
import {
  buildCounselSessionData,
  DEFAULT_COUNSEL_SESSION_PARAMS,
  describeCounselSessionEffect,
  type CounselSessionParams,
} from "@/lib/counselSessionParams";
import type { CounselSessionData } from "@/lib/counselSessionData";
import { cn } from "@/lib/utils";
import { Monitor, RotateCw } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import RequestPanel from "./RequestPanel";
import SessionForm from "./SessionForm";

const RAIL_DEFAULT_WIDTH = 420;
const RAIL_MIN_WIDTH = 320;
const RAIL_MAX_WIDTH = 720;

/** Keyboard step for the resize handle. */
const RAIL_KEYBOARD_STEP = 16;

function clampRailWidth(width: number): number {
  return Math.min(RAIL_MAX_WIDTH, Math.max(RAIL_MIN_WIDTH, width));
}

type PlaygroundPageProps = {
  counselApiConfig: CounselApiConfig;
};

/** Build a session data body on the left, launch it, and watch the Counsel app respond on the right. */
export default function PlaygroundPage({
  counselApiConfig,
}: PlaygroundPageProps) {
  const [params, setParams] = useState<CounselSessionParams>(
    DEFAULT_COUNSEL_SESSION_PARAMS
  );
  const [signedAppUrl, setSignedAppUrl] = useState<string | null>(null);
  const [isAppReady, setIsAppReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The body behind the current preview, so a retry relaunches what was sent rather than later form edits.
  const lastLaunchRef = useRef<CounselSessionData | null>(null);

  const splitRef = useRef<HTMLDivElement>(null);
  const [railWidth, setRailWidth] = useState(RAIL_DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);

  const needsThread = params.action === "open_thread";

  // Only the thread picker needs the list, so it isn't fetched until asked for.
  const { threads, isLoading: isThreadsLoading } = useCounselThreads(
    counselApiConfig,
    { enabled: needsThread }
  );
  const { getSignedUrl, isPending } = useCounselSignedUrl(counselApiConfig);

  const sessionData = useMemo(() => buildCounselSessionData(params), [params]);
  const canLaunch = !needsThread || params.threadId.length > 0;

  const iframeOrigin = useCounselIframeOrigin(signedAppUrl);

  useCounselInboundMessages({
    iframeOrigin,
    onMessage: (message) => {
      if (message.type === "counsel:ready") setIsAppReady(true);
    },
  });

  // `counsel:ready` is the only signal the app rendered, so there is deliberately no timeout: if it never fires that's a bug,
  // and a spinner that stays up shows it. "Relaunch session" stays enabled while loading, so it's always recoverable.
  const isPreviewLoading = isPending || (signedAppUrl !== null && !isAppReady);

  async function launch(body: CounselSessionData) {
    lastLaunchRef.current = body;
    try {
      const url = await getSignedUrl(body);
      setIsAppReady(false);
      setSignedAppUrl(url);
      setError(null);
    } catch (err) {
      clientLogger.error({ err }, "Failed to mint a signed app url");
      setError(
        err instanceof Error ? err.message : "Failed to mint a signed url."
      );
    }
  }

  /** Signed urls are single use, so a retry always mints a new one. */
  function retry() {
    void launch(lastLaunchRef.current ?? sessionData);
  }

  function resizeRail(clientX: number) {
    const bounds = splitRef.current?.getBoundingClientRect();
    if (!bounds) return;
    setRailWidth(clampRailWidth(clientX - bounds.left));
  }

  return (
    <div
      ref={splitRef}
      className={cn(
        "flex h-full w-full flex-col overflow-y-auto lg:flex-row lg:overflow-hidden",
        isResizing && "select-none"
      )}
    >
      <aside
        // A variable so the dragged width only applies to the two-column layout.
        style={{ "--rail-width": `${railWidth}px` } as React.CSSProperties}
        className="flex w-full shrink-0 flex-col border-b bg-background lg:h-full lg:w-[var(--rail-width)] lg:border-b-0"
      >
        <div className="border-b px-5 py-4">
          <h1 className="font-semibold">Playground</h1>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Build the session data for <code>POST /v1/user/signedAppUrl</code>{" "}
            and launch it. The body decides what the Counsel app shows when the
            signed url opens — within what your organization has enabled.
          </p>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
          <SessionForm
            params={params}
            onChange={setParams}
            threads={threads}
            isThreadsLoading={isThreadsLoading}
          />
          <RequestPanel
            body={JSON.stringify(sessionData, null, 2)}
            effect={describeCounselSessionEffect(params)}
          />
        </div>

        <div className="space-y-2 border-t px-5 py-3">
          {error && (
            <div className="flex items-start justify-between gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs leading-relaxed text-destructive">
              <p className="min-w-0">{error}</p>
              <Button
                variant="ghost"
                size="sm"
                className="-my-1 -mr-2 h-7 shrink-0 px-2 text-xs text-destructive hover:text-destructive"
                disabled={isPending}
                onClick={retry}
              >
                <RotateCw className="size-3.5" />
                Retry
              </Button>
            </div>
          )}
          <Button
            className="w-full"
            disabled={!canLaunch || isPending}
            onClick={() => void launch(sessionData)}
          >
            {isPending
              ? "Minting signed url…"
              : signedAppUrl
                ? "Relaunch session"
                : "Launch session"}
          </Button>
        </div>
      </aside>

      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize the playground panels"
        aria-valuenow={railWidth}
        aria-valuemin={RAIL_MIN_WIDTH}
        aria-valuemax={RAIL_MAX_WIDTH}
        tabIndex={0}
        onKeyDown={(event) => {
          const step =
            event.key === "ArrowLeft"
              ? -RAIL_KEYBOARD_STEP
              : event.key === "ArrowRight"
                ? RAIL_KEYBOARD_STEP
                : 0;
          if (!step) return;
          event.preventDefault();
          setRailWidth((width) => clampRailWidth(width + step));
        }}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          setIsResizing(true);
        }}
        onPointerMove={(event) => {
          if (isResizing) resizeRail(event.clientX);
        }}
        onPointerUp={(event) => {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        // Fires after pointerup and also when the gesture is cancelled, so the drag can't get stuck on.
        onLostPointerCapture={() => setIsResizing(false)}
        className={cn(
          "hidden w-1.5 shrink-0 cursor-col-resize bg-border outline-none transition-colors hover:bg-foreground/20 focus-visible:bg-foreground/20 lg:block",
          isResizing && "bg-foreground/20"
        )}
      />

      <section className="relative min-h-[36rem] min-w-0 flex-1 bg-gray-50 lg:min-h-0">
        {signedAppUrl ? (
          <CounselApp
            // Signed urls are single use, so each launch needs its own iframe.
            key={signedAppUrl}
            signedAppUrl={signedAppUrl}
            className="h-full w-full"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
            <Monitor className="size-6 text-muted-foreground" />
            <p className="text-sm font-medium">Nothing launched yet</p>
            <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
              Configure a session on the left, then launch it to load the
              Counsel app in an iframe the way your own app would.
            </p>
          </div>
        )}

        {isPreviewLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background">
            <div className="size-6 animate-spin rounded-full border-2 border-muted border-t-foreground" />
            <p className="text-xs text-muted-foreground">
              {isPending ? (
                "Minting a signed url…"
              ) : (
                <>
                  Loading the Counsel app… waiting for{" "}
                  <code>counsel:ready</code>
                </>
              )}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
