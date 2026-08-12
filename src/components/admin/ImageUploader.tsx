"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { validateImageFile } from "@/lib/storage/images";
import {
  deleteClientStorageFile,
  uploadMainImage,
} from "@/lib/storage/upload-client";
import type { PostImage } from "@/types";
import { cn } from "@/lib/utils/cn";

interface ImageUploaderProps {
  postId: string;
  value: PostImage | null;
  onChange: (image: PostImage | null) => void;
  disabled?: boolean;
  label?: string;
}

export function ImageUploader({
  postId,
  value,
  onChange,
  disabled = false,
  label = "Main image",
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [alt, setAlt] = useState(value?.alt ?? "");

  async function handleFile(file: File | undefined) {
    if (!file || !postId) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.errors[0] ?? "Invalid image");
      return;
    }

    setUploading(true);
    try {
      const previousPath = value?.path;
      const image = await uploadMainImage(postId, file, alt);
      onChange(image);
      if (previousPath && previousPath !== image.path) {
        try {
          await deleteClientStorageFile(previousPath);
        } catch {
          // Non-fatal — orphaned file can be cleaned later.
        }
      }
      toast.success("Image uploaded");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Upload failed",
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleRemove() {
    if (!value) return;
    setUploading(true);
    try {
      await deleteClientStorageFile(value.path);
      onChange(null);
      toast.success("Image removed");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to remove image",
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-zinc-800">{label}</label>
        {value ? (
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled || uploading}
            className="inline-flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove
          </button>
        ) : null}
      </div>

      <div
        className={cn(
          "relative overflow-hidden rounded-lg border border-dashed border-zinc-300 bg-zinc-50",
          value ? "aspect-[16/10]" : "aspect-[16/7]",
        )}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value.url}
            alt={value.alt || "Main image"}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
            <ImagePlus className="h-8 w-8 text-zinc-400" />
            <p className="text-sm text-zinc-500">
              JPEG, PNG, WebP, or AVIF up to 10MB
            </p>
          </div>
        )}

        {uploading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-700" />
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={disabled || uploading || !postId}
          onClick={() => inputRef.current?.click()}
          className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
        >
          {value ? "Replace image" : "Upload image"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-600">
          Alt text
        </label>
        <input
          type="text"
          value={value ? value.alt : alt}
          onChange={(e) => {
            const next = e.target.value;
            setAlt(next);
            if (value) onChange({ ...value, alt: next });
          }}
          disabled={disabled}
          className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#b87333] focus:ring-1 focus:ring-[#b87333]"
          placeholder="Describe the image"
        />
      </div>
    </div>
  );
}
