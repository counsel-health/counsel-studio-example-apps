"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useFormStatus } from "react-dom";
import { handleLogin } from "@/actions/handleLogin";
import { useActionState } from "react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      className="w-full mt-6 bg-brand-400 hover:bg-brand-500"
      type="submit"
      loading={pending}
    >
      Login
    </Button>
  );
}

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(handleLogin, null);

  // Submit form on Enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isPending) return;
    if (
      (e.ctrlKey || e.metaKey) &&
      (e.key === "Enter" || e.key === "NumpadEnter")
    ) {
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f5f5f0] items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white shadow-sm border-[#e6e2cf]">
        <CardHeader className="space-y-1">
          <CardTitle className="font-heading text-3xl font-bold text-center text-primary">
            Studio Demo
          </CardTitle>
          <CardDescription className="text-center text-brand-400">
            Ask the Counsel Team for an access code to play with the demo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction}>
            <div className="flex flex-col gap-y-4">
              <div className="flex flex-col gap-y-4">
                <Label htmlFor="accessCode">Access Code</Label>
                <Input
                  id="accessCode"
                  name="accessCode"
                  placeholder="Enter access code"
                  required
                  type="password"
                  disabled={isPending}
                  // Don't prompt browser autocomplete
                  autoComplete="off"
                  onKeyDown={handleKeyDown}
                  className="border-[#e6e2cf] focus:border-[#a8d5ba] focus:ring-[#a8d5ba]"
                />
              </div>
              {state?.message && (
                <p className="text-red-500 text-sm">{state.message}</p>
              )}
            </div>
            <SubmitButton />
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
