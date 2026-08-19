const ALLOWED_MIME_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
]);

const ALLOWED_EXTENSIONS = new Set(["mp4", "webm", "ogg", "ogv", "mov", "m4v"]);

export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

export interface VideoFileLike {
  name: string;
  type: string;
  size: number;
}

export interface VideoValidationResult {
  valid: boolean;
  errors: string[];
}

function getExtension(fileName: string): string {
  const idx = fileName.lastIndexOf(".");
  if (idx < 0) return "";
  return fileName.slice(idx + 1).toLowerCase();
}

export function validateVideoFile(file: VideoFileLike): VideoValidationResult {
  const errors: string[] = [];

  if (!file?.name) {
    errors.push("File name is required");
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    errors.push("Unsupported file type. Allowed: MP4, WebM, OGG, MOV");
  }

  const ext = getExtension(file.name);
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    errors.push("Unsupported file extension. Allowed: .mp4, .webm, .ogg, .mov, .m4v");
  }

  if (!Number.isFinite(file.size) || file.size <= 0) {
    errors.push("File size is invalid");
  } else if (file.size > MAX_VIDEO_BYTES) {
    errors.push("Video must be under 50MB");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function assertValidVideoFile(file: VideoFileLike): void {
  const result = validateVideoFile(file);
  if (!result.valid) {
    throw new Error(result.errors.join("; "));
  }
}
