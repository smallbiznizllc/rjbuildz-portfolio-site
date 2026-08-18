"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateGlobalSeoAction } from "@/app/admin/actions/settings";
import { TagInput } from "@/components/admin/TagInput";
import type { GlobalSeo } from "@/types";

interface GlobalSeoFormProps {
  initial: GlobalSeo;
}

const inputClass =
  "w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-[#b87333] focus:ring-1 focus:ring-[#b87333]";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-zinc-800">
        {label}
      </label>
      {hint ? <p className="mb-2 text-xs text-zinc-500">{hint}</p> : null}
      {children}
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-lg border border-zinc-200 bg-white p-5 sm:p-6">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          {title}
        </h2>
        <p className="mt-1 text-sm text-zinc-600">{description}</p>
      </div>
      {children}
    </section>
  );
}

export function GlobalSeoForm({ initial }: GlobalSeoFormProps) {
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState(
    initial.googleAnalyticsId ?? "",
  );
  const [googleTagManagerId, setGoogleTagManagerId] = useState(
    initial.googleTagManagerId ?? "",
  );
  const [googleSiteVerification, setGoogleSiteVerification] = useState(
    initial.googleSiteVerification ?? "",
  );
  const [metaTitle, setMetaTitle] = useState(initial.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(
    initial.metaDescription ?? "",
  );
  const [metaKeywords, setMetaKeywords] = useState(initial.metaKeywords);
  const [canonicalUrl, setCanonicalUrl] = useState(initial.canonicalUrl ?? "");
  const [robotsIndex, setRobotsIndex] = useState(initial.robotsIndex);
  const [robotsFollow, setRobotsFollow] = useState(initial.robotsFollow);
  const [ogTitle, setOgTitle] = useState(initial.ogTitle ?? "");
  const [ogDescription, setOgDescription] = useState(initial.ogDescription ?? "");
  const [ogImageUrl, setOgImageUrl] = useState(initial.ogImageUrl ?? "");
  const [ogType, setOgType] = useState(initial.ogType || "website");
  const [twitterCard, setTwitterCard] = useState(initial.twitterCard);
  const [twitterHandle, setTwitterHandle] = useState(
    initial.twitterHandle ?? "",
  );
  const [schemaJson, setSchemaJson] = useState(initial.schemaJson ?? "");
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await updateGlobalSeoAction({
        googleAnalyticsId: googleAnalyticsId || null,
        googleTagManagerId: googleTagManagerId || null,
        googleSiteVerification: googleSiteVerification || null,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        metaKeywords,
        canonicalUrl: canonicalUrl || null,
        robotsIndex,
        robotsFollow,
        ogTitle: ogTitle || null,
        ogDescription: ogDescription || null,
        ogImageUrl: ogImageUrl || null,
        ogType,
        twitterCard,
        twitterHandle: twitterHandle || null,
        schemaJson: schemaJson || null,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("SEO settings saved");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-5">
      <Section
        title="Analytics & verification"
        description="Measurement IDs and Search Console verification for the public site. Leave blank to skip."
      >
        <Field
          label="Google Analytics ID"
          hint="GA4 measurement ID such as G-XXXXXXXX. Skip this if you already fire GA from Tag Manager."
        >
          <input
            value={googleAnalyticsId}
            onChange={(e) => setGoogleAnalyticsId(e.target.value)}
            className={inputClass}
            placeholder="G-XXXXXXXX"
            autoComplete="off"
            spellCheck={false}
          />
        </Field>
        <Field
          label="Google Tag Manager ID"
          hint="Container ID such as GTM-XXXXXXX."
        >
          <input
            value={googleTagManagerId}
            onChange={(e) => setGoogleTagManagerId(e.target.value)}
            className={inputClass}
            placeholder="GTM-XXXXXXX"
            autoComplete="off"
            spellCheck={false}
          />
        </Field>
        <Field
          label="Google site verification"
          hint="Content value from the google-site-verification meta tag."
        >
          <input
            value={googleSiteVerification}
            onChange={(e) => setGoogleSiteVerification(e.target.value)}
            className={inputClass}
            placeholder="verification token"
            autoComplete="off"
            spellCheck={false}
          />
        </Field>
      </Section>

      <Section
        title="Meta tags"
        description="Default title, description, keywords, canonical URL, and robots directives. Individual posts can still override title and description."
      >
        <Field label="Meta title" hint="Up to 70 characters. Used as the default browser title.">
          <input
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
            maxLength={70}
            className={inputClass}
            placeholder="RJ Buildz — Creative Portfolio"
          />
        </Field>
        <Field
          label="Meta description"
          hint="Up to 160 characters. Shown in search results when a page has no description of its own."
        >
          <textarea
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
            maxLength={160}
            rows={3}
            className={inputClass}
          />
        </Field>
        <TagInput
          id="seo-keywords"
          label="Meta keywords"
          hint="Optional. Press Enter after each keyword."
          value={metaKeywords}
          onChange={setMetaKeywords}
          placeholder="portfolio, design, build"
        />
        <Field label="Canonical URL" hint="Optional absolute URL for the homepage canonical tag.">
          <input
            type="url"
            value={canonicalUrl}
            onChange={(e) => setCanonicalUrl(e.target.value)}
            className={inputClass}
            placeholder="https://rjbuildz.com"
          />
        </Field>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm text-zinc-800">
            <input
              type="checkbox"
              checked={robotsIndex}
              onChange={(e) => setRobotsIndex(e.target.checked)}
              className="size-4 rounded border-zinc-300"
            />
            Allow search indexing
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-800">
            <input
              type="checkbox"
              checked={robotsFollow}
              onChange={(e) => setRobotsFollow(e.target.checked)}
              className="size-4 rounded border-zinc-300"
            />
            Allow following links
          </label>
        </div>
      </Section>

      <Section
        title="Open Graph"
        description="Defaults used when a page is shared on Facebook, LinkedIn, and similar networks."
      >
        <Field label="OG title">
          <input
            value={ogTitle}
            onChange={(e) => setOgTitle(e.target.value)}
            maxLength={70}
            className={inputClass}
            placeholder="Falls back to the meta title"
          />
        </Field>
        <Field label="OG description">
          <textarea
            value={ogDescription}
            onChange={(e) => setOgDescription(e.target.value)}
            maxLength={200}
            rows={3}
            className={inputClass}
            placeholder="Falls back to the meta description"
          />
        </Field>
        <Field label="OG image URL" hint="Absolute URL. Recommended 1200×630.">
          <input
            type="url"
            value={ogImageUrl}
            onChange={(e) => setOgImageUrl(e.target.value)}
            className={inputClass}
            placeholder="https://rjbuildz.com/og.jpg"
          />
        </Field>
        <Field label="OG type">
          <select
            value={ogType}
            onChange={(e) => setOgType(e.target.value)}
            className={inputClass}
          >
            <option value="website">website</option>
            <option value="article">article</option>
            <option value="profile">profile</option>
            <option value="book">book</option>
          </select>
        </Field>
      </Section>

      <Section
        title="Twitter / X"
        description="Card type and site handle used for Twitter previews."
      >
        <Field label="Card type">
          <select
            value={twitterCard}
            onChange={(e) =>
              setTwitterCard(
                e.target.value === "summary"
                  ? "summary"
                  : "summary_large_image",
              )
            }
            className={inputClass}
          >
            <option value="summary_large_image">summary_large_image</option>
            <option value="summary">summary</option>
          </select>
        </Field>
        <Field label="Twitter handle" hint="With or without the @.">
          <input
            value={twitterHandle}
            onChange={(e) => setTwitterHandle(e.target.value)}
            className={inputClass}
            placeholder="@rjbuildz"
            autoComplete="off"
            spellCheck={false}
          />
        </Field>
      </Section>

      <Section
        title="Schema.org JSON-LD"
        description="Optional structured data injected on public pages. Must be a JSON object or array."
      >
        <Field
          label="JSON-LD"
          hint='Example: { "@context": "https://schema.org", "@type": "Person", "name": "RJ Buildz" }'
        >
          <textarea
            value={schemaJson}
            onChange={(e) => setSchemaJson(e.target.value)}
            rows={10}
            spellCheck={false}
            className={`${inputClass} font-mono text-[13px] leading-5`}
            placeholder={`{\n  "@context": "https://schema.org",\n  "@type": "Organization",\n  "name": "RJ Buildz"\n}`}
          />
        </Field>
      </Section>

      <div className="pt-1">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save SEO settings"}
        </button>
      </div>
    </form>
  );
}
