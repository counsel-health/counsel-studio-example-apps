import { Logo } from "@/components/logo";
import { Skeleton } from "@/components/ui/skeleton";
import type { ThreadItem } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import { LogOut, SquarePen, Stethoscope, X } from "lucide-react";
import { useCallback, useMemo } from "react";
import type { HostThread } from "./types";

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

type UnifiedThread = { type: "host"; thread: HostThread } | { type: "counsel"; thread: ThreadItem };

type ChatListProps = {
  hostThreads: HostThread[];
  counselThreads: ThreadItem[];
  activeThreadId: string | null;
  activeThreadType: "host" | "counsel" | null;
  onHostThreadClick: (threadId: string) => void;
  onCounselThreadClick: (threadId: string) => void;
  onNewChat: () => void;
  onSignOut: () => void;
  onClose?: () => void;
  isPending: boolean;
  isThreadsLoading?: boolean;
};

export default function ChatList({
  hostThreads,
  counselThreads,
  activeThreadId,
  activeThreadType,
  onHostThreadClick,
  onCounselThreadClick,
  onNewChat,
  onSignOut,
  onClose,
  isPending,
  isThreadsLoading,
}: ChatListProps) {
  const allThreads = useMemo<UnifiedThread[]>(
    () =>
      [
        ...hostThreads.map((thread): UnifiedThread => ({ type: "host", thread })),
        ...counselThreads.map((thread): UnifiedThread => ({ type: "counsel", thread })),
      ].sort(
        (a, b) =>
          new Date(b.thread.last_activity_time).getTime() -
          new Date(a.thread.last_activity_time).getTime(),
      ),
    [hostThreads, counselThreads],
  );

  const handleSelectThread = useCallback(
    (item: UnifiedThread) => {
      if (item.type === "host") onHostThreadClick(item.thread.id);
      else onCounselThreadClick(item.thread.id);
      onClose?.();
    },
    [onHostThreadClick, onCounselThreadClick, onClose],
  );

  return (
    <aside className="flex flex-col h-full w-full bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 h-16 shrink-0 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <Logo className="size-5 text-zinc-900 dark:text-zinc-100" />
          <span className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Studio Demo
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              onNewChat();
              onClose?.();
            }}
            disabled={isPending}
            aria-label="New chat"
            className="flex items-center justify-center size-9 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-40 transition-colors"
          >
            <SquarePen className="size-5" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Close sidebar"
              className="flex items-center justify-center size-9 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              <X className="size-5" />
            </button>
          )}
        </div>
      </div>

      {/* Thread list */}
      <div className="flex-1 overflow-y-auto py-2">
        {isThreadsLoading && (
          <div
            className="space-y-0 px-1"
            role="status"
            aria-busy="true"
            aria-label="Loading conversations"
          >
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="w-[calc(100%-8px)] mx-1 px-4 py-2.5 rounded-lg">
                <Skeleton className="h-[18px] w-[min(85%,14rem)] mb-2 rounded-md animate-pulse dark:from-zinc-800 dark:to-zinc-700" />
                <Skeleton className="h-3 w-14 rounded-md animate-pulse dark:from-zinc-800 dark:to-zinc-700" />
              </div>
            ))}
          </div>
        )}
        {!isThreadsLoading && allThreads.length === 0 && (
          <p className="px-4 py-3 text-sm text-zinc-400">No conversations yet</p>
        )}
        {/* Wait until all threads are loaded before rendering */}
        {!isThreadsLoading &&
          allThreads.length > 0 &&
          allThreads.map((item) => {
            const isActive = activeThreadId === item.thread.id && activeThreadType === item.type;
            const displayName =
              item.thread.display_name || (item.type === "counsel" ? "Counsel chat" : "New chat");

            return (
              <button
                key={`${item.type}-${item.thread.id}`}
                onClick={() => handleSelectThread(item)}
                disabled={isPending}
                className={cn(
                  "group w-full text-left px-4 py-2.5 rounded-lg mx-1 transition-colors",
                  "w-[calc(100%-8px)]",
                  isActive
                    ? "bg-zinc-100 dark:bg-zinc-800"
                    : "hover:bg-zinc-50 dark:hover:bg-zinc-900",
                  isPending && "opacity-50 cursor-wait",
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {item.type === "counsel" && (
                    <Stethoscope className="size-3.5 text-blue-500 shrink-0" />
                  )}
                  <span className="text-sm text-zinc-800 dark:text-zinc-200 truncate font-normal leading-snug">
                    {displayName}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 truncate">
                  {formatRelativeTime(item.thread.last_activity_time)}
                </p>
              </button>
            );
          })}
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-zinc-100 dark:border-zinc-800 p-3">
        <button
          onClick={onSignOut}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
        >
          <LogOut className="size-4 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
