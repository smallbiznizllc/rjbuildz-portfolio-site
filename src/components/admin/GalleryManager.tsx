"use client";

import { useRef, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { validateImageFile } from "@/lib/storage/images";
import {
  createGalleryImageId,
  deleteClientStorageFile,
  uploadGalleryImage,
} from "@/lib/storage/upload-client";
import type { GalleryImage } from "@/types";
import { cn } from "@/lib/utils/cn";

interface GalleryManagerProps {
  postId: string;
  value: GalleryImage[];
  onChange: (images: GalleryImage[]) => void;
  disabled?: boolean;
}

function SortableGalleryItem({
  image,
  disabled,
  onUpdate,
  onRemove,
}: {
  image: GalleryImage;
  disabled?: boolean;
  onUpdate: (image: GalleryImage) => void;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-lg border border-zinc-200 bg-white p-3",
        isDragging && "z-10 shadow-lg",
      )}
    >
      <div className="mb-2 flex items-start gap-2">
        <button
          type="button"
          className="mt-1 cursor-grab touch-none rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 active:cursor-grabbing"
          aria-label="Drag to reorder"
          disabled={disabled}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="relative aspect-square w-20 shrink-0 overflow-hidden rounded-md bg-zinc-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.url}
            alt={image.alt || "Gallery image"}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <input
            type="text"
            value={image.alt}
            onChange={(e) => onUpdate({ ...image, alt: e.target.value })}
            disabled={disabled}
            placeholder="Alt text"
            className="w-full rounded-md border border-zinc-200 px-2.5 py-1.5 text-sm outline-none focus:border-[#b87333] focus:ring-1 focus:ring-[#b87333]"
          />
          <input
            type="text"
            value={image.caption ?? ""}
            onChange={(e) =>
              onUpdate({ ...image, caption: e.target.value || null })
            }
            disabled={disabled}
            placeholder="Caption (optional)"
            className="w-full rounded-md border border-zinc-200 px-2.5 py-1.5 text-sm outline-none focus:border-[#b87333] focus:ring-1 focus:ring-[#b87333]"
          />
        </div>
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          className="rounded p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50"
          aria-label="Remove image"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function GalleryManager({
  postId,
  value,
  onChange,
  disabled = false,
}: GalleryManagerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function reorderWithSortOrder(images: GalleryImage[]) {
    return images.map((img, index) => ({ ...img, sortOrder: index }));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = value.findIndex((img) => img.id === active.id);
    const newIndex = value.findIndex((img) => img.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onChange(reorderWithSortOrder(arrayMove(value, oldIndex, newIndex)));
  }

  async function handleFiles(files: FileList | null) {
    if (!files?.length || !postId) return;
    setUploading(true);
    try {
      const next = [...value];
      for (const file of Array.from(files)) {
        const validation = validateImageFile(file);
        if (!validation.valid) {
          toast.error(`${file.name}: ${validation.errors[0]}`);
          continue;
        }
        const id = createGalleryImageId();
        const image = await uploadGalleryImage(postId, id, file, {
          sortOrder: next.length,
        });
        next.push(image);
      }
      onChange(reorderWithSortOrder(next));
      toast.success("Gallery updated");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gallery upload failed",
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleRemove(image: GalleryImage) {
    try {
      await deleteClientStorageFile(image.path);
      onChange(
        reorderWithSortOrder(value.filter((item) => item.id !== image.id)),
      );
      toast.success("Image removed");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to remove image",
      );
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium text-zinc-800">Gallery</h3>
          <p className="text-xs text-zinc-500">
            Drag to reorder. Alt and captions are optional.
          </p>
        </div>
        <button
          type="button"
          disabled={disabled || uploading || !postId}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImagePlus className="h-4 w-4" />
          )}
          Add images
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {value.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500">
          No gallery images yet
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={value.map((img) => img.id)}
            strategy={rectSortingStrategy}
          >
            <div className="space-y-2">
              {value.map((image) => (
                <SortableGalleryItem
                  key={image.id}
                  image={image}
                  disabled={disabled || uploading}
                  onUpdate={(next) =>
                    onChange(
                      value.map((item) =>
                        item.id === next.id ? next : item,
                      ),
                    )
                  }
                  onRemove={() => handleRemove(image)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
