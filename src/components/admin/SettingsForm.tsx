"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateSiteSettingsAction } from "@/app/admin/actions/settings";

interface SettingsFormProps {
  initial: {
    siteName: string;
    owner: string | null;
    aboutBlurb: string | null;
    tagline: string | null;
    contactEmail: string | null;
  };
}

export function SettingsForm({ initial }: SettingsFormProps) {
  const [siteName, setSiteName] = useState(initial.siteName);
  const [owner, setOwner] = useState(initial.owner ?? "");
  const [aboutBlurb, setAboutBlurb] = useState(initial.aboutBlurb ?? "");
  const [tagline, setTagline] = useState(initial.tagline ?? "");
  const [contactEmail, setContactEmail] = useState(initial.contactEmail ?? "");
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await updateSiteSettingsAction({
        siteName,
        owner: owner || null,
        aboutBlurb: aboutBlurb || null,
        tagline: tagline || null,
        contactEmail: contactEmail || null,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Settings saved");
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-xl space-y-5 rounded-lg border border-zinc-200 bg-white p-5 sm:p-6"
    >
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-800">
          Site name
        </label>
        <input
          required
          value={siteName}
          onChange={(e) => setSiteName(e.target.value)}
          className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-[#b87333] focus:ring-1 focus:ring-[#b87333]"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-800">
          Owner
        </label>
        <input
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-[#b87333] focus:ring-1 focus:ring-[#b87333]"
          placeholder="Display name for the site owner"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-800">
          About blurb
        </label>
        <textarea
          value={aboutBlurb}
          onChange={(e) => setAboutBlurb(e.target.value)}
          rows={5}
          className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-[#b87333] focus:ring-1 focus:ring-[#b87333]"
          placeholder="Short about text for the public site"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-800">
          Tagline
        </label>
        <input
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-[#b87333] focus:ring-1 focus:ring-[#b87333]"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-800">
          Contact email
        </label>
        <input
          type="email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-[#b87333] focus:ring-1 focus:ring-[#b87333]"
        />
      </div>
      <div className="pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save settings"}
        </button>
      </div>
    </form>
  );
}
