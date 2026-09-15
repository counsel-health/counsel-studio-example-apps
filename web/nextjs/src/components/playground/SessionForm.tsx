"use client";

import { COUNSEL_NAVIGATIONS, COUNSEL_THEMES } from "@/lib/counselSessionData";
import {
  COUNSEL_MODULE_OPTIONS,
  COUNSEL_SESSION_ACTION_OPTIONS,
  COUNSEL_SESSION_SEED_OPTIONS,
  type CounselSessionActionKind,
} from "@/lib/counselSessionOptions";
import {
  isThreadStartingAction,
  type CounselSessionParams,
} from "@/lib/counselSessionParams";
import type { ThreadItem } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

const SELECT_CLASS =
  "h-9 w-full appearance-none rounded-md border bg-background pl-3 pr-8 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]";

/** Options for a view field, which Counsel falls back to its own default for when left unset. */
function optionalOptions(values: readonly string[]) {
  return [
    { value: "", label: "Not set" },
    ...values.map((value) => ({ value, label: value })),
  ];
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-xs font-medium text-foreground">
      {children}
    </span>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
  hint,
  mono,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  hint?: string;
  /** Renders the value in monospace, for options that are API values rather than prose. */
  mono?: boolean;
}) {
  return (
    <label className="block space-y-1.5">
      <FieldLabel>{label}</FieldLabel>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={cn(SELECT_CLASS, mono && "font-mono text-xs")}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </label>
  );
}

function RadioCard({
  label,
  description,
  name,
  value,
  selected,
  onSelect,
}: {
  label: string;
  description: string;
  name: string;
  value: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-2.5 rounded-md border px-3 py-2.5 transition-colors",
        "has-[:focus-visible]:border-ring has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50",
        selected ? "border-foreground/40 bg-accent" : "hover:bg-accent/50"
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={selected}
        onChange={onSelect}
        className="sr-only"
      />
      <span
        aria-hidden
        className={cn(
          "mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border transition-colors",
          selected ? "border-foreground bg-foreground" : "bg-background"
        )}
      >
        {selected && <span className="size-1.5 rounded-full bg-background" />}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-foreground">
          {label}
        </span>
        <span className="block text-xs leading-relaxed text-muted-foreground">
          {description}
        </span>
      </span>
    </label>
  );
}

type SessionFormProps = {
  params: CounselSessionParams;
  onChange: (params: CounselSessionParams) => void;
  /** Only populated for `open_thread`, which is the one action that needs it. */
  threads: ThreadItem[];
  isThreadsLoading: boolean;
};

/** The controls for a session data body: the action, what it carries, and how the app is presented. */
export default function SessionForm({
  params,
  onChange,
  threads,
  isThreadsLoading,
}: SessionFormProps) {
  const isThreadStarting = isThreadStartingAction(params.action);
  const needsThread = params.action === "open_thread";
  const actionOption = COUNSEL_SESSION_ACTION_OPTIONS.find(
    (option) => option.value === params.action
  );

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <SelectField
          label="Action"
          mono
          value={params.action}
          options={COUNSEL_SESSION_ACTION_OPTIONS}
          onChange={(value) =>
            onChange({ ...params, action: value as CounselSessionActionKind })
          }
        />
        <p className="text-xs leading-relaxed text-muted-foreground">
          {actionOption?.description}
        </p>
      </div>

      <div className="space-y-4 border-t pt-4">
        {isThreadStarting && (
          <>
            <SelectField
              label="Module"
              value={params.module}
              options={COUNSEL_MODULE_OPTIONS}
              hint="Modules are configured per organization. One yours has disabled is refused with 403 Module not available."
              onChange={(value) =>
                onChange({
                  ...params,
                  module: value as CounselSessionParams["module"],
                })
              }
            />
            <div className="space-y-1.5">
              <FieldLabel>Start the thread with</FieldLabel>
              <div className="space-y-1.5">
                {COUNSEL_SESSION_SEED_OPTIONS.map((option) => (
                  <RadioCard
                    key={option.value}
                    name="counsel-session-seed"
                    value={option.value}
                    label={option.label}
                    description={option.description}
                    selected={params.seed === option.value}
                    onSelect={() => onChange({ ...params, seed: option.value })}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {needsThread && (
          <SelectField
            label="Thread"
            value={params.threadId}
            onChange={(value) => onChange({ ...params, threadId: value })}
            hint={
              params.threadId
                ? undefined
                : "Pick a thread to launch this action."
            }
            options={[
              {
                value: "",
                label: isThreadsLoading
                  ? "Loading threads…"
                  : threads.length === 0
                    ? "No threads yet — start one first"
                    : "Select a thread",
              },
              ...threads.map((thread) => ({
                value: thread.id,
                label: thread.display_name || "Counsel chat",
              })),
            ]}
          />
        )}

        {actionOption?.note && (
          <p className="rounded-md border border-dashed px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
            {actionOption.note}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 border-t pt-4">
        <SelectField
          label="Theme"
          value={params.theme}
          onChange={(value) =>
            onChange({
              ...params,
              theme: value as CounselSessionParams["theme"],
            })
          }
          options={optionalOptions(COUNSEL_THEMES)}
        />
        <SelectField
          label="Navigation"
          value={params.navigation}
          onChange={(value) =>
            onChange({
              ...params,
              navigation: value as CounselSessionParams["navigation"],
            })
          }
          options={optionalOptions(COUNSEL_NAVIGATIONS)}
        />
      </div>
    </div>
  );
}
