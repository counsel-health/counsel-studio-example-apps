import type { Ref } from "react";
import { X } from "lucide-react";
import { CounselApp } from "@/components/counsel/CounselApp";
import { cn } from "@/lib/utils";
import { VelaBrand } from "./icons";

type CareTakeoverProps = {
  isOpen: boolean;
  onClose: () => void;
  closeRef: Ref<HTMLButtonElement>;
  signedAppUrl: string;
};

/**
 * Full-page Medical chat that slides in from the right over Vela's home.
 *
 * It stays mounted while closed, parked off-screen and `inert`, so the Counsel iframe loads with
 * the page and keeps its conversation between opens. The signed url is single use, so remounting
 * the iframe on every open would need a new one each time.
 */
export default function CareTakeover({
  isOpen,
  onClose,
  closeRef,
  signedAppUrl,
}: CareTakeoverProps) {
  return (
    <section
      role="dialog"
      aria-modal="true"
      aria-label="Medical chat"
      inert={!isOpen}
      className={cn(
        "fixed inset-0 z-10 flex flex-col bg-(--chat-bg) text-(--chat-text) motion-reduce:transition-none",
        // Visibility flips at once on open and only after the slide on close, so focus can move in right away.
        isOpen
          ? "visible translate-x-0 transition-[translate] duration-(--chat-in-duration) ease-[cubic-bezier(.2,.8,.2,1)]"
          : "invisible translate-x-full transition-[translate,visibility] duration-(--chat-out-duration) ease-[cubic-bezier(.4,0,1,1)]"
      )}
    >
      <header className="flex items-center justify-between gap-4 border-b border-(--chat-border) px-8 py-4">
        <VelaBrand compact />
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="flex size-11 cursor-pointer items-center justify-center rounded-full text-(--chat-icon)"
          aria-label="Close medical chat"
        >
          <X className="size-[22px]" strokeWidth={1.8} aria-hidden="true" />
        </button>
      </header>
      {/* The iframe fills this box, so it needs a definite height: flex-1 with min-h-0. */}
      <div className="min-h-0 flex-1">
        <CounselApp signedAppUrl={signedAppUrl} className="h-full w-full" />
      </div>
    </section>
  );
}
