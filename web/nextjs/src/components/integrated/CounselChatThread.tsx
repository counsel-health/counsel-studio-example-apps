import { CounselApp } from "@/components/counsel/CounselApp";
import { cn } from "@/lib/utils";

type CounselChatThreadProps = {
  hidden?: boolean;
  signedAppUrl: string;
  /** Real Counsel thread ID to switch to without reloading the iframe. */
  currentThreadId?: string;
  onLoad?: () => void;
};

/**
 * CounselChatThread wraps the Counsel iframe for displaying a Counsel thread
 * in the integrated navigation mode.
 */
export default function CounselChatThread({
  hidden,
  signedAppUrl,
  currentThreadId,
  onLoad,
}: CounselChatThreadProps) {
  return (
    <div className={cn("relative h-full w-full", hidden ? "hidden" : "")}>
      <CounselApp
        key={signedAppUrl}
        signedAppUrl={signedAppUrl}
        className="h-full w-full"
        currentThreadId={currentThreadId}
        onLoad={onLoad}
      />
    </div>
  );
}
