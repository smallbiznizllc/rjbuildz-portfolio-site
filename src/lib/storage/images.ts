const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

const ALLOWED_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "avif",
]);

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB

export interface ImageFileLike {
  name: string;
  type: string;
  size: number;
}

export interface ImageValidationResult {
  valid: boolean;
  errors: string[];
}

function getExtension(fileName: string): string {
  const idx = fileName.lastIndexOf(".");
  if (idx < 0) return "";
  return fileName.slice(idx + 1).toLowerCase();
}

/**
 * Validate an image upload (browser File or metadata object).
 * Enforces MIME type, extension, and 10MB size limit.
 */
export function validateImageFile(file: ImageFileLike): ImageValidationResult {
  const errors: string[] = [];

  if (!file?.name) {
    errors.push("File name is required");
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    errors.push(
      "Unsupported file type. Allowed: JPEG, PNG, WebP, AVIF",
    );
  }

  const ext = getExtension(file.name);
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    errors.push(
      "Unsupported file extension. Allowed: .jpg, .jpeg, .png, .webp, .avif",
    );
  }

  if (!Number.isFinite(file.size) || file.size <= 0) {
    errors.push("File size is invalid");
  } else if (file.size > MAX_IMAGE_BYTES) {
    errors.push("Image must be under 10MB");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function assertValidImageFile(file: ImageFileLike): void {
  const result = validateImageFile(file);
  if (!result.valid) {
    throw new Error(result.errors.join("; "));
  }
}
