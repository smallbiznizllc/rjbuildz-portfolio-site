import { describe, expect, it } from "vitest";
import { parseVideoUrl } from "@/lib/media/video";

describe("parseVideoUrl", () => {
  it("parses YouTube watch URLs", () => {
    const parsed = parseVideoUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(parsed?.provider).toBe("youtube");
    expect(parsed?.id).toBe("dQw4w9WgXcQ");
    expect(parsed?.embedUrl).toContain("youtube-nocookie.com/embed/dQw4w9WgXcQ");
  });

  it("parses youtu.be short links", () => {
    const parsed = parseVideoUrl("https://youtu.be/dQw4w9WgXcQ");
    expect(parsed?.provider).toBe("youtube");
    expect(parsed?.id).toBe("dQw4w9WgXcQ");
  });

  it("parses Vimeo URLs", () => {
    const parsed = parseVideoUrl("https://vimeo.com/123456789");
    expect(parsed?.provider).toBe("vimeo");
    expect(parsed?.embedUrl).toBe(
      "https://player.vimeo.com/video/123456789?autoplay=1",
    );
  });

  it("parses direct video files", () => {
    const parsed = parseVideoUrl("https://cdn.example.com/clip.mp4");
    expect(parsed?.provider).toBe("file");
    expect(parsed?.embedUrl).toBeNull();
  });

  it("rejects non-URLs", () => {
    expect(parseVideoUrl("not a url")).toBeNull();
  });
});
