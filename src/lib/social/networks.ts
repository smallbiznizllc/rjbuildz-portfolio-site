export const SOCIAL_NETWORKS = [
  {
    id: "instagram",
    label: "Instagram",
    placeholder: "@rjbuildz or https://instagram.com/rjbuildz",
    urlTemplate: "https://www.instagram.com/{handle}",
  },
  {
    id: "facebook",
    label: "Facebook",
    placeholder: "page name or profile URL",
    urlTemplate: "https://www.facebook.com/{handle}",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    placeholder: "in/your-name or profile URL",
    urlTemplate: "https://www.linkedin.com/in/{handle}",
  },
  {
    id: "x",
    label: "X",
    placeholder: "@handle or profile URL",
    urlTemplate: "https://x.com/{handle}",
  },
  {
    id: "youtube",
    label: "YouTube",
    placeholder: "@channel or channel URL",
    urlTemplate: "https://www.youtube.com/@{handle}",
  },
  {
    id: "github",
    label: "GitHub",
    placeholder: "username or profile URL",
    urlTemplate: "https://github.com/{handle}",
  },
  {
    id: "dribbble",
    label: "Dribbble",
    placeholder: "username or profile URL",
    urlTemplate: "https://dribbble.com/{handle}",
  },
  {
    id: "behance",
    label: "Behance",
    placeholder: "username or profile URL",
    urlTemplate: "https://www.behance.net/{handle}",
  },
  {
    id: "pinterest",
    label: "Pinterest",
    placeholder: "username or profile URL",
    urlTemplate: "https://www.pinterest.com/{handle}",
  },
  {
    id: "tiktok",
    label: "TikTok",
    placeholder: "@handle or profile URL",
    urlTemplate: "https://www.tiktok.com/@{handle}",
  },
  {
    id: "threads",
    label: "Threads",
    placeholder: "@handle or profile URL",
    urlTemplate: "https://www.threads.net/@{handle}",
  },
  {
    id: "vimeo",
    label: "Vimeo",
    placeholder: "username or profile URL",
    urlTemplate: "https://vimeo.com/{handle}",
  },
  {
    id: "bluesky",
    label: "Bluesky",
    placeholder: "handle.bsky.social or profile URL",
    urlTemplate: "https://bsky.app/profile/{handle}",
  },
  {
    id: "website",
    label: "Website",
    placeholder: "https://example.com",
    urlTemplate: "https://{handle}",
  },
] as const;

export type SocialNetworkId = (typeof SOCIAL_NETWORKS)[number]["id"];

const NETWORK_IDS = new Set<string>(SOCIAL_NETWORKS.map((network) => network.id));

export function isSocialNetworkId(value: string): value is SocialNetworkId {
  return NETWORK_IDS.has(value);
}

export function getSocialNetwork(id: SocialNetworkId) {
  return SOCIAL_NETWORKS.find((network) => network.id === id)!;
}

function stripHandle(value: string): string {
  return value.trim().replace(/^@+/, "").replace(/^\/+/, "");
}

export function resolveSocialHref(
  network: SocialNetworkId,
  value: string,
): string {
  const raw = value.trim();
  if (!raw) {
    throw new Error("Enter a URL or handle");
  }

  if (/^https?:\/\//i.test(raw)) {
    return new URL(raw).toString();
  }

  if (/^www\./i.test(raw)) {
    return new URL(`https://${raw}`).toString();
  }

  const spec = getSocialNetwork(network);
  const handle = stripHandle(raw);
  if (!handle) {
    throw new Error("Enter a URL or handle");
  }

  if (network === "website") {
    return new URL(`https://${handle}`).toString();
  }

  if (network === "linkedin" && /^in\//i.test(handle)) {
    return `https://www.linkedin.com/${handle.replace(/^in\//i, "in/")}`;
  }

  if (network === "youtube" && handle.startsWith("c/")) {
    return `https://www.youtube.com/${handle}`;
  }

  return spec.urlTemplate.replace("{handle}", handle);
}
