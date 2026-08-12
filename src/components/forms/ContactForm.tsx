"use client";

import { useId, useState, useTransition } from "react";
import { contactMessageSchema } from "@/lib/validation/schemas";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";
import { cn } from "@/lib/utils/cn";

type FormState = {
  name: string;
  email: string;
  message: string;
};

const INITIAL: FormState = { name: "", email: "", message: "" };

export function ContactForm({
  variant = "page",
  className,
}: {
  variant?: "page" | "footer";
  className?: string;
}) {
  const formId = useId();
  const [values, setValues] = useState<FormState>(INITIAL);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof FormState, string>>
  >({});
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const isFooter = variant === "footer";

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    setStatus("idle");
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const parsed = contactMessageSchema.safeParse(values);
    if (!parsed.success) {
      const next: Partial<Record<keyof FormState, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === "name" || key === "email" || key === "message") {
          next[key] = issue.message;
        }
      }
      setFieldErrors(next);
      setStatus("error");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        });
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        if (!res.ok) {
          setStatus("error");
          setErrorMessage(
            data.error || "Something went wrong. Please try again.",
          );
          return;
        }
        setValues(INITIAL);
        setFieldErrors({});
        setStatus("success");
      } catch {
        setStatus("error");
        setErrorMessage("Network error. Please try again.");
      }
    });
  }

  const inputClass = isFooter
    ? "bg-charcoal-soft border-parchment/15 text-parchment placeholder:text-parchment/40 focus-visible:border-copper focus-visible:ring-copper/40"
    : undefined;

  const labelClass = isFooter ? "text-parchment/80" : undefined;

  return (
    <form
      onSubmit={onSubmit}
      className={cn("space-y-4", className)}
      noValidate
      aria-describedby={
        status === "success"
          ? `${formId}-success`
          : status === "error" && errorMessage
            ? `${formId}-error`
            : undefined
      }
    >
      <div>
        <Label htmlFor={`${formId}-name`} className={labelClass}>
          Name
        </Label>
        <Input
          id={`${formId}-name`}
          name="name"
          autoComplete="name"
          required
          value={values.name}
          onChange={(e) => update("name", e.target.value)}
          aria-invalid={Boolean(fieldErrors.name)}
          aria-describedby={
            fieldErrors.name ? `${formId}-name-error` : undefined
          }
          className={inputClass}
          disabled={pending}
        />
        {fieldErrors.name ? (
          <p
            id={`${formId}-name-error`}
            className="mt-1.5 text-xs text-red-400"
            role="alert"
          >
            {fieldErrors.name}
          </p>
        ) : null}
      </div>

      <div>
        <Label htmlFor={`${formId}-email`} className={labelClass}>
          Email
        </Label>
        <Input
          id={`${formId}-email`}
          name="email"
          type="email"
          autoComplete="email"
          required
          value={values.email}
          onChange={(e) => update("email", e.target.value)}
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={
            fieldErrors.email ? `${formId}-email-error` : undefined
          }
          className={inputClass}
          disabled={pending}
        />
        {fieldErrors.email ? (
          <p
            id={`${formId}-email-error`}
            className="mt-1.5 text-xs text-red-400"
            role="alert"
          >
            {fieldErrors.email}
          </p>
        ) : null}
      </div>

      <div>
        <Label htmlFor={`${formId}-message`} className={labelClass}>
          Message
        </Label>
        <Textarea
          id={`${formId}-message`}
          name="message"
          required
          rows={isFooter ? 4 : 6}
          value={values.message}
          onChange={(e) => update("message", e.target.value)}
          aria-invalid={Boolean(fieldErrors.message)}
          aria-describedby={
            fieldErrors.message ? `${formId}-message-error` : undefined
          }
          className={inputClass}
          disabled={pending}
        />
        {fieldErrors.message ? (
          <p
            id={`${formId}-message-error`}
            className="mt-1.5 text-xs text-red-400"
            role="alert"
          >
            {fieldErrors.message}
          </p>
        ) : null}
      </div>

      {status === "success" ? (
        <p
          id={`${formId}-success`}
          className={cn(
            "text-sm",
            isFooter ? "text-copper" : "text-copper",
          )}
          role="status"
        >
          Thanks — your message was sent.
        </p>
      ) : null}

      {status === "error" && errorMessage ? (
        <p
          id={`${formId}-error`}
          className="text-sm text-red-400"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}

      <Button
        type="submit"
        variant={isFooter ? "primary" : "primary"}
        disabled={pending}
        className={isFooter ? "w-full sm:w-auto" : undefined}
      >
        {pending ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
