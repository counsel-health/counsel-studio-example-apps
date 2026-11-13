"use client";

import "@/styles/themes/studio.css";
import "@/styles/themes/vela.css";
import "@/styles/themes/example.css";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Brand } from "@/lib/brands";
import { cn } from "@/lib/utils";
import CareTakeover from "./CareTakeover";
import HomeContent from "./HomeContent";
import { velaBody, velaDisplay } from "./fonts";

type HomePageProps = {
  brand: Brand;
  signedAppUrl: string;
};

/**
 * Dashboard home with Counsel behind its "Get care" button. Every color, font, radius and
 * duration comes from the brand's `data-theme` tokens in `src/styles/themes`.
 */
export default function HomePage({ brand, signedAppUrl }: HomePageProps) {
  const [isCareOpen, setIsCareOpen] = useState(false);
  const getCareRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);

  const openCare = useCallback(() => setIsCareOpen(true), []);
  const closeCare = useCallback(() => setIsCareOpen(false), []);

  // Hand focus back to "Get care" once the dialog has closed, however it was closed.
  useEffect(() => {
    if (!isCareOpen && wasOpenRef.current) getCareRef.current?.focus();
    wasOpenRef.current = isCareOpen;
  }, [isCareOpen]);

  return (
    <div
      data-theme={brand}
      className={cn(
        velaDisplay.variable,
        velaBody.variable,
        "h-full overflow-x-hidden overflow-y-auto bg-(--app-bg) font-(family-name:--font-body) text-(--app-text)"
      )}
    >
      <HomeContent getCareRef={getCareRef} onGetCare={openCare} />
      <CareTakeover
        brand={brand}
        isOpen={isCareOpen}
        onClose={closeCare}
        signedAppUrl={signedAppUrl}
      />
    </div>
  );
}
