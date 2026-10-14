"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { clientLogger } from "@/lib/clientLogger";
import type { CounselSessionEffect } from "@/lib/counselSessionParams";
import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";

type RequestPanelProps = {
  /** The session data body, formatted for display. */
  body: string;
  effect: CounselSessionEffect;
};

/** The request the launch button will send, next to what Counsel does with it. */
export default function RequestPanel({ body, effect }: RequestPanelProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timeout);
  }, [copied]);

  return (
    <div className="space-y-3 rounded-lg border bg-muted/40 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          What happens
        </span>
        <Badge variant="secondary">{effect.label}</Badge>
      </div>
      <p className="text-sm leading-relaxed text-foreground">{effect.detail}</p>
      <div className="space-y-2 border-t pt-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-foreground">
            Request body
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="-my-1 -mr-2 h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => {
              // Only say "Copied" if the copy actually worked.
              navigator.clipboard
                .writeText(body)
                .then(() => setCopied(true))
                .catch((err: unknown) =>
                  clientLogger.warn({ err }, "Failed to copy request body")
                );
            }}
          >
            {copied ? (
              <Check className="size-3.5" />
            ) : (
              <Copy className="size-3.5" />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
        {/* Fixed height so the panel doesn't resize as the body grows and shrinks. */}
        <pre className="h-48 overflow-auto rounded-md bg-brand-500 p-3 font-mono text-[11px] leading-relaxed text-brand-50">
          {body}
        </pre>
      </div>
    </div>
  );
}
