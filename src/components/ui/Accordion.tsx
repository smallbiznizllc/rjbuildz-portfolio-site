"use client";

import {
  createContext,
  useCallback,
  useContext,
  useId,
  useState,
  type ReactNode,
} from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type AccordionContextValue = {
  openId: string | null;
  setOpenId: (id: string | null) => void;
  baseId: string;
};

const AccordionContext = createContext<AccordionContextValue | null>(null);

function useAccordion() {
  const ctx = useContext(AccordionContext);
  if (!ctx) {
    throw new Error("AccordionItem must be used within Accordion");
  }
  return ctx;
}

export function Accordion({
  children,
  defaultOpenId = null,
  className,
}: {
  children: ReactNode;
  defaultOpenId?: string | null;
  className?: string;
}) {
  const [openId, setOpenId] = useState<string | null>(defaultOpenId);
  const baseId = useId();

  return (
    <AccordionContext.Provider value={{ openId, setOpenId, baseId }}>
      <div
        className={cn(
          "divide-y divide-[var(--border-subtle)] border-y border-[var(--border-subtle)]",
          className,
        )}
      >
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

export function AccordionItem({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  const { openId, setOpenId, baseId } = useAccordion();
  const open = openId === id;
  const panelId = `${baseId}-${id}-panel`;
  const buttonId = `${baseId}-${id}-button`;

  const toggle = useCallback(() => {
    setOpenId(open ? null : id);
  }, [id, open, setOpenId]);

  return (
    <div>
      <h2 className="m-0">
        <button
          type="button"
          id={buttonId}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={toggle}
          className="flex w-full items-center justify-between gap-4 py-4 text-left transition-colors hover:text-copper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copper"
        >
          <span className="font-display text-2xl text-charcoal sm:text-3xl">
            {title}
          </span>
          <ChevronDown
            className={cn(
              "h-5 w-5 shrink-0 text-copper transition-transform duration-200",
              open && "rotate-180",
            )}
            aria-hidden
          />
        </button>
      </h2>
      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        hidden={!open}
        className={cn(!open && "hidden")}
      >
        <div className="pb-8 pt-1">{children}</div>
      </div>
    </div>
  );
}
