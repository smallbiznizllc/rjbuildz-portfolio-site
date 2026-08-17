"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { TAG_MAX_COUNT, TAG_MAX_LENGTH, normalizeTags } from "@/lib/utils/tags";

export function TagInput({
  id,
  label,
  hint,
  value,
  onChange,
  placeholder = "Type a tag and press Enter",
}: {
  id: string;
  label: string;
  hint?: string;
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  function commit(raw: string) {
    const pieces = raw.split(/[,;\n]+/);
    const next = normalizeTags([...value, ...pieces]);
    if (next.length === value.length && pieces.every((p) => !p.trim())) {
      setDraft("");
      return;
    }
    onChange(next.slice(0, TAG_MAX_COUNT));
    setDraft("");
  }

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-zinc-800">
        {label}
      </label>
      {hint ? <p className="mb-2 text-xs text-zinc-500">{hint}</p> : null}
      <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-md border border-zinc-200 px-2 py-1.5 focus-within:border-[#b87333] focus-within:ring-1 focus-within:ring-[#b87333]">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex max-w-full items-center gap-1 rounded-full bg-[#b87333] px-2.5 py-1 text-xs font-medium text-white"
          >
            <span className="truncate">{tag}</span>
            <button
              type="button"
              onClick={() => onChange(value.filter((item) => item !== tag))}
              className="inline-flex size-4 shrink-0 items-center justify-center rounded-full text-white/80 hover:bg-black/15 hover:text-white"
              aria-label={`Remove ${tag}`}
            >
              <X className="size-3" strokeWidth={2.5} />
            </button>
          </span>
        ))}
        <input
          id={id}
          type="text"
          value={draft}
          maxLength={TAG_MAX_LENGTH}
          disabled={value.length >= TAG_MAX_COUNT}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              commit(draft);
            } else if (event.key === "Backspace" && !draft && value.length > 0) {
              onChange(value.slice(0, -1));
            }
          }}
          onBlur={() => {
            if (draft.trim()) commit(draft);
          }}
          placeholder={value.length >= TAG_MAX_COUNT ? "Maximum tags reached" : placeholder}
          className="min-w-[10rem] flex-1 border-0 bg-transparent py-1 text-sm text-zinc-800 outline-none placeholder:text-zinc-400"
        />
      </div>
    </div>
  );
}
