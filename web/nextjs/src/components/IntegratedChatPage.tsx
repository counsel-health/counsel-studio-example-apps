"use client";

import { signOut } from "@/actions/signOut";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  useCounselCreateThread,
  useCounselPreloadSignedUrl,
  useCounselSignedUrl,
  useCounselThreads,
  type CounselApiConfig,
} from "@/hooks/useCounselApi";
import {
  useCounselIframeOrigin,
  useCounselInboundMessages,
} from "@/hooks/useCounselAppMessageHandler";
import { clientLogger } from "@/lib/clientLogger";
import { PanelLeftOpen } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import ChatList from "./integrated/ChatList";
import ChatThread from "./integrated/ChatThread";
import CounselChatThread from "./integrated/CounselChatThread";
import type { HostThread } from "./integrated/types";

// ---------------------------------------------------------------------------
// Trigger phrase — any message containing this (case-insensitive) will show
// the "Connect to Counsel" card.
// ---------------------------------------------------------------------------

const COUNSEL_TRIGGER = "doctor";

// ---------------------------------------------------------------------------
// Mock data — one hardcoded host thread as the default conversation
// ---------------------------------------------------------------------------

let nextHostThreadId = 2;

function createDefaultHostThread(): HostThread {
  return {
    id: "host-1",
    display_name: "Welcome",
    last_activity_time: new Date().toISOString(),
    messages: [
      {
        role: "bot",
        text: "Welcome! This is your care team's chat. How can we help you today?",
      },
    ],
  };
}

function createNewHostThread(): HostThread {
  const id = `host-${nextHostThreadId++}`;
  return {
    id,
    display_name: "New chat",
    last_activity_time: new Date().toISOString(),
    messages: [
      {
        role: "bot",
        text: "Hi there! How can we help you?",
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActiveThread = { type: "host"; id: string } | { type: "counsel"; id: string };

type IntegratedChatPageProps = {
  /** Counsel API routing: JWT calls Counsel directly; API key sessions use `/api/counsel/*` proxies. */
  counselApiConfig: CounselApiConfig;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * IntegratedChatPage demonstrates the "integrated" navigation pattern:
 * the host app manages the thread sidebar and renders either its own chat
 * UI (host threads) or the Counsel iframe (Counsel threads).
 *
 * JWT sessions call the Counsel API from the browser; API key sessions use
 * Next.js route handlers that proxy to the demo server (same as dashboard chat).
 */
export default function IntegratedChatPage({ counselApiConfig }: IntegratedChatPageProps) {
  const defaultThread = createDefaultHostThread();

  const [hostThreads, setHostThreads] = useState<HostThread[]>([defaultThread]);
  const [activeThread, setActiveThread] = useState<ActiveThread>({
    type: "host",
    id: defaultThread.id,
  });
  const activeThreadRef = useRef<ActiveThread>(activeThread);
  activeThreadRef.current = activeThread;
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  // The signed URL currently loaded in the Counsel iframe. Kept stable so the
  // iframe is not reloaded unnecessarily — switching threads uses switch_thread.
  const [counselSessionUrl, setCounselSessionUrl] = useState<string | null>(null);
  // When set, triggers a counsel:switchThread postMessage to the live iframe.
  const [activeCounselThreadId, setActiveCounselThreadId] = useState<string | null>(null);

  const {
    threads: counselThreads,
    isLoading: isThreadsLoading,
    addThread,
    invalidateThreads,
  } = useCounselThreads(counselApiConfig);
  const { getSignedUrl, isPending: isSignedUrlPending } = useCounselSignedUrl(counselApiConfig);
  const { createThread, isPending: isCreateThreadPending } =
    useCounselCreateThread(counselApiConfig);
  const preloadedSignedUrl = useCounselPreloadSignedUrl(counselApiConfig);
  const isLoading = isSignedUrlPending || isCreateThreadPending;

  const counselIframeOrigin = useCounselIframeOrigin(counselSessionUrl);

  useCounselInboundMessages({
    iframeOrigin: counselIframeOrigin,
    onMessage: (message) => {
      if (message.type === "counsel:thread_created") {
        invalidateThreads();
      }
    },
  });

  // User-navigated URLs take precedence; fall back to the preloaded URL so the
  // iframe warms in the background without any user action required.
  const effectiveSignedUrl = counselSessionUrl ?? preloadedSignedUrl;

  // ---- Handlers -----------------------------------------------------------

  const handleHostThreadClick = useCallback(
    (threadId: string) => {
      if (isLoading) return;
      setActiveThread({ type: "host", id: threadId });
    },
    [isLoading],
  );

  const handleCounselThreadClick = useCallback(
    async (threadId: string) => {
      if (isLoading) return;
      setActiveThread({ type: "counsel", id: threadId });

      // If the iframe is already loaded (or preloaded), switch threads via postMessage (no reload)
      if (effectiveSignedUrl) {
        setActiveCounselThreadId(threadId);
        return;
      }

      // First Counsel thread click with no preloaded URL — get a signed URL with open_thread
      try {
        const url = await getSignedUrl({
          action: { action: "open_thread", thread_id: threadId },
        });
        setCounselSessionUrl(url);
      } catch (error) {
        clientLogger.error({ err: error }, "Failed to load Counsel thread");
      }
    },
    [isLoading, getSignedUrl, effectiveSignedUrl],
  );

  const handleNewChat = useCallback(() => {
    if (isLoading) return;
    setHostThreads((prev) => {
      const existing = prev.find((t) => t.messages.every((m) => m.role === "bot"));
      if (existing) {
        setActiveThread({ type: "host", id: existing.id });
        return prev;
      }
      const newThread = createNewHostThread();
      setActiveThread({ type: "host", id: newThread.id });
      return [newThread, ...prev];
    });
  }, [isLoading]);

  const handleSendMessage = useCallback((threadId: string, text: string) => {
    const isTrigger = text.toLowerCase().includes(COUNSEL_TRIGGER);

    setHostThreads((prev) =>
      prev.map((t) =>
        t.id === threadId
          ? {
              ...t,
              last_activity_time: new Date().toISOString(),
              showCounselCard: isTrigger ? true : t.showCounselCard,
              messages: [
                ...t.messages,
                { role: "user" as const, text },
                ...(!isTrigger
                  ? [
                      {
                        role: "bot" as const,
                        text: "Thanks for your message! Request to talk to a doctor to proceed with the demo.",
                      },
                    ]
                  : []),
              ],
            }
          : t,
      ),
    );
  }, []);

  const handleConnectCounsel = useCallback(
    async (hostThreadId: string) => {
      if (isLoading) return;
      try {
        const thread = hostThreads.find((t) => t.id === hostThreadId);
        const messages = thread?.messages ?? [];

        const initial_messages = messages.map((m) => ({
          body: m.text,
          role: m.role === "user" ? ("patient" as const) : ("model" as const),
        }));

        const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
        const reason_for_handoff =
          lastUserMessage?.text ?? "Agent detected a need for medical assistance";

        // Show loading state while keeping the host thread in state until success.
        setActiveCounselThreadId(null);
        setActiveThread({ type: "counsel", id: `counsel-loading-${Date.now()}` });

        // 1. Create the thread via API — returns immediately with thread_id
        const { thread_id } = await createThread({
          initial_messages,
          agent_context: { reason_for_handoff },
        });

        // 2. Append ?threadId to the signed URL so the Counsel app opens directly
        //    into the new thread on load. Uses the preloaded URL as the base if
        //    available (assets are already cached), otherwise fetches one now.
        const base = effectiveSignedUrl ?? (await getSignedUrl(undefined));
        const urlWithThread = new URL(base);
        urlWithThread.searchParams.set("threadId", thread_id);
        setCounselSessionUrl(urlWithThread.toString());

        setHostThreads((prev) =>
          prev.map((t) => (t.id === hostThreadId ? { ...t, showCounselCard: false } : t)),
        );

        // Add the real thread to the sidebar immediately
        addThread({
          id: thread_id,
          display_name: "Counsel chat",
          last_activity_time: new Date().toISOString(),
          mode: "ai",
        });
        setActiveThread({ type: "counsel", id: thread_id });
        setActiveCounselThreadId(thread_id);
      } catch (error) {
        clientLogger.error({ err: error }, "Failed to connect to Counsel");
        // Restore the host thread view so the user's conversation isn't lost
        setActiveThread({ type: "host", id: hostThreadId });
      }
    },
    [isLoading, createThread, getSignedUrl, addThread, hostThreads, effectiveSignedUrl],
  );

  // ---- Shared sidebar props -----------------------------------------------
  const chatListProps = useMemo(
    () => ({
      hostThreads,
      counselThreads,
      activeThreadId: activeThread.id,
      activeThreadType: activeThread.type,
      onHostThreadClick: handleHostThreadClick,
      onCounselThreadClick: handleCounselThreadClick,
      onNewChat: handleNewChat,
      onSignOut: signOut,
      isPending: isLoading,
      isThreadsLoading,
    }),
    [
      hostThreads,
      counselThreads,
      activeThread,
      isLoading,
      isThreadsLoading,
      handleHostThreadClick,
      handleCounselThreadClick,
      handleNewChat,
    ],
  );

  // ---- Render -------------------------------------------------------------

  const activeHostThread =
    activeThread.type === "host" ? hostThreads.find((t) => t.id === activeThread.id) : null;

  return (
    <div className="flex h-full w-full">
      {/* Desktop sidebar */}
      <div className="hidden sm:flex w-72 shrink-0 h-full">
        <ChatList {...chatListProps} />
      </div>

      {/* Mobile sidebar — Sheet drawer */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetContent side="left" className="p-0 w-72 [&>button:last-child]:hidden">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="h-full">
            <ChatList {...chatListProps} onClose={() => setIsMobileOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Main content area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile-only top bar — always visible above both host chat and Counsel iframe */}
        <div className="sm:hidden flex items-center px-3 h-11 border-b border-zinc-100 dark:border-zinc-800 shrink-0 bg-white dark:bg-zinc-950">
          <button
            onClick={() => setIsMobileOpen(true)}
            aria-label="Open menu"
            className="flex items-center justify-center size-9 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <PanelLeftOpen className="size-5" />
          </button>
        </div>

        {/* Chat content */}
        <div className="flex-1 min-h-0 relative">
          {activeThread.type === "host" && activeHostThread && (
            <ChatThread
              key={activeHostThread.id}
              thread={activeHostThread}
              onSendMessage={handleSendMessage}
              onConnectCounsel={handleConnectCounsel}
              isConnecting={isLoading}
            />
          )}

          {activeThread.type === "counsel" && isLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="size-8 border-2 border-zinc-300 border-t-blue-500 rounded-full animate-spin" />
            </div>
          )}

          {effectiveSignedUrl && (
            <CounselChatThread
              hidden={activeThread.type !== "counsel" || isLoading}
              signedAppUrl={effectiveSignedUrl}
              currentThreadId={activeCounselThreadId ?? undefined}
            />
          )}
        </div>
      </div>
    </div>
  );
}
