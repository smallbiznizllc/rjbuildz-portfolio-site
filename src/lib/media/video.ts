export type GalleryItemKind = "image" | "video";

export type ParsedVideo =
  | {
      provider: "youtube";
      id: string;
      pageUrl: string;
      embedUrl: string;
      thumbnailUrl: string;
    }
  | {
      provider: "vimeo";
      id: string;
      pageUrl: string;
      embedUrl: string;
      thumbnailUrl: null;
    }
  | {
      provider: "file";
      id: null;
      pageUrl: string;
      embedUrl: null;
      thumbnailUrl: null;
    }
  | {
      provider: "embed";
      id: null;
      pageUrl: string;
      embedUrl: string;
      thumbnailUrl: null;
    };

const VIDEO_FILE_EXT = /\.(mp4|webm|ogg|ogv|mov|m4v)(?:$|\?)/i;

function asUrl(raw: string): URL | null {
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url;
  } catch {
    return null;
  }
}

function youtubeIdFromUrl(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, "");
  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    return id && /^[\w-]{11}$/.test(id) ? id : null;
  }
  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    if (url.searchParams.get("v") && /^[\w-]{11}$/.test(url.searchParams.get("v")!)) {
      return url.searchParams.get("v");
    }
    const parts = url.pathname.split("/").filter(Boolean);
    const marker = parts.findIndex((part) =>
      ["embed", "shorts", "live", "v"].includes(part),
    );
    if (marker >= 0) {
      const id = parts[marker + 1];
      if (id && /^[\w-]{11}$/.test(id)) return id;
    }
  }
  return null;
}

function vimeoIdFromUrl(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, "");
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const parts = url.pathname.split("/").filter(Boolean);
    const maybeId = host === "player.vimeo.com" && parts[0] === "video" ? parts[1] : parts[0];
    if (maybeId && /^\d+$/.test(maybeId)) return maybeId;
  }
  return null;
}

export function parseVideoUrl(raw: string): ParsedVideo | null {
  const url = asUrl(raw);
  if (!url) return null;

  const youtubeId = youtubeIdFromUrl(url);
  if (youtubeId) {
    return {
      provider: "youtube",
      id: youtubeId,
      pageUrl: `https://www.youtube.com/watch?v=${youtubeId}`,
      embedUrl: `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0`,
      thumbnailUrl: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
    };
  }

  const vimeoId = vimeoIdFromUrl(url);
  if (vimeoId) {
    return {
      provider: "vimeo",
      id: vimeoId,
      pageUrl: `https://vimeo.com/${vimeoId}`,
      embedUrl: `https://player.vimeo.com/video/${vimeoId}?autoplay=1`,
      thumbnailUrl: null,
    };
  }

  if (VIDEO_FILE_EXT.test(url.pathname) || VIDEO_FILE_EXT.test(url.href)) {
    return {
      provider: "file",
      id: null,
      pageUrl: url.href,
      embedUrl: null,
      thumbnailUrl: null,
    };
  }

  return {
    provider: "embed",
    id: null,
    pageUrl: url.href,
    embedUrl: url.href,
    thumbnailUrl: null,
  };
}

export function isGalleryVideo(item: { kind?: string | null }): boolean {
  return item.kind === "video";
}
