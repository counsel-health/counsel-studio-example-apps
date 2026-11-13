"use client";

import "./themes/vela.css";
import "./themes/example.css";
import { useCallback, useEffect, useRef, useState } from "react";
import type { VelaTheme } from "@/lib/vela";
import { cn } from "@/lib/utils";
import CareTakeover from "./CareTakeover";
import VelaHome from "./VelaHome";
import { velaBody, velaDisplay } from "./fonts";

type VelaAppProps = {
  signedAppUrl: string;
  theme: VelaTheme;
};

/**
 * A partner wellness app ("Vela") with Counsel embedded behind its "Get care" button.
 * Every color, font, radius and duration comes from the `data-theme` tokens in `./themes`.
 */
export default function VelaApp({ signedAppUrl, theme }: VelaAppProps) {
  const [isCareOpen, setIsCareOpen] = useState(false);
  const getCareRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const hasOpenedRef = useRef(false);

  const openCare = useCallback(() => setIsCareOpen(true), []);
  const closeCare = useCallback(() => setIsCareOpen(false), []);

  // Focus moves after the commit, once `inert` is off the side that's becoming active.
  useEffect(() => {
    if (isCareOpen) {
      hasOpenedRef.current = true;
      closeRef.current?.focus();
    } else if (hasOpenedRef.current) {
      getCareRef.current?.focus();
    }
  }, [isCareOpen]);

  // Esc only reaches us while focus is in Vela's own chrome; keys pressed inside the
  // cross-origin Counsel iframe stay in the iframe.
  useEffect(() => {
    if (!isCareOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCare();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isCareOpen, closeCare]);

  return (
    <div
      data-theme={theme}
      className={cn(
        velaDisplay.variable,
        velaBody.variable,
        "fixed inset-0 overflow-x-hidden bg-(--app-bg) font-(family-name:--font-body) text-(--app-text)",
        isCareOpen ? "overflow-y-hidden" : "overflow-y-auto"
      )}
    >
      <div inert={isCareOpen}>
        <VelaHome getCareRef={getCareRef} onGetCare={openCare} />
      </div>
      <CareTakeover
        isOpen={isCareOpen}
        onClose={closeCare}
        closeRef={closeRef}
        signedAppUrl={signedAppUrl}
      />
    </div>
  );
}
