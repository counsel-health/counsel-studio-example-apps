import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { CounselApp } from "@/components/counsel/CounselApp";
import type { Brand } from "@/lib/brands";
import { cn } from "@/lib/utils";
import { BrandLogo } from "./icons";

type CareTakeoverProps = {
  brand: Brand;
  isOpen: boolean;
  onClose: () => void;
  signedAppUrl: string;
};

/**
 * Full-page Medical chat that slides in from the right over the whole app, Studio header included.
 *
 * Opened as a modal `<dialog>`, so the browser makes the rest of the page inert, moves focus to
 * the close button and closes on Esc. While closed it stays rendered, parked off-screen and
 * `inert`, so the Counsel iframe loads with the page and keeps its conversation between opens. The
 * signed url is single use, so remounting the iframe on every open would need a new one each time.
 */
export default function CareTakeover({
  brand,
  isOpen,
  onClose,
  signedAppUrl,
}: CareTakeoverProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      aria-label="Medical chat"
      inert={!isOpen}
      // Fires for Esc as well as close(), so state follows however the dialog was closed.
      // Esc only reaches the page while focus is in the header; keys pressed inside the
      // cross-origin Counsel iframe stay in the iframe.
      onClose={onClose}
      className={cn(
        // Override the browser's dialog box and keep it laid out while closed, so the iframe loads.
        "fixed inset-0 z-30 m-0 flex size-full max-h-none max-w-none flex-col border-0 bg-(--chat-bg) p-0 text-(--chat-text) backdrop:bg-transparent motion-reduce:transition-none",
        // Visibility flips at once on open and only after the slide on close, so focus can move in right away.
        isOpen
          ? "visible translate-x-0 transition-[translate] duration-(--chat-in-duration) ease-[cubic-bezier(.2,.8,.2,1)]"
          : "invisible translate-x-full transition-[translate,visibility] duration-(--chat-out-duration) ease-[cubic-bezier(.4,0,1,1)]"
      )}
    >
      <header className="flex items-center justify-between gap-4 border-b border-(--chat-border) px-8 py-4">
        <BrandLogo brand={brand} />
        <button
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
    </dialog>
  );
}
