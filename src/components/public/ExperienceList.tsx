"use client";

import { useDeferredValue, useId, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/Input";

export type ExperienceRole = {
  company: string;
  role: string;
  dates: string;
  location: string;
  bullets: readonly string[];
};

function matchesQuery(job: ExperienceRole, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    job.company,
    job.role,
    job.dates,
    job.location,
    ...job.bullets,
  ]
    .join(" ")
    .toLowerCase();
  return q
    .split(/\s+/)
    .filter(Boolean)
    .every((token) => haystack.includes(token));
}

export function ExperienceList({ roles }: { roles: readonly ExperienceRole[] }) {
  const inputId = useId();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const filtered = useMemo(
    () => roles.filter((job) => matchesQuery(job, deferredQuery)),
    [roles, deferredQuery],
  );

  return (
    <div>
      <div className="relative">
        <label htmlFor={inputId} className="sr-only">
          Search experience
        </label>
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-muted/70"
          aria-hidden
        />
        <Input
          id={inputId}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by keyword (e.g. Angular, WordPress, DAM)"
          className="pl-10"
          autoComplete="off"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="mt-8 text-base text-ink-muted" role="status">
          No experience matches “{query.trim()}”.
        </p>
      ) : (
        <ol className="mt-8 space-y-10">
          {filtered.map((job) => (
            <li key={`${job.company}-${job.dates}`}>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                <h3 className="font-display text-xl text-charcoal">
                  {job.company}
                </h3>
                <p className="shrink-0 text-sm text-ink-muted">{job.dates}</p>
              </div>
              <p className="mt-1 text-sm font-medium text-copper">{job.role}</p>
              <p className="mt-0.5 text-sm text-ink-muted">{job.location}</p>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-base leading-relaxed text-ink-muted">
                {job.bullets.map((bullet) => (
                  <li key={bullet} className="marker:text-copper/70">
                    {bullet}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
