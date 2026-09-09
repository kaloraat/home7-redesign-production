"use client";

import { useEffect, useId, useRef, useState, type DragEvent } from "react";
import { uploadImageFile, type UploadFolder } from "@/lib/clientImageUpload";

type ImageItem = {
  id: string;
  url: string; // object URL while uploading, CloudFront URL once done
  status: "uploading" | "done" | "error";
  error?: string;
};

type Props = {
  name: string; // form field name the parent Server Action reads (newline-separated URLs)
  defaultValue?: string[];
  /** Which S3 prefix this upload belongs under — properties/agents/blog. */
  folder: UploadFolder;
  /** Existing record's slug, for organizing the S3 key. Omitted for a
   * not-yet-created record — a random draft id is used instead so uploads
   * can start before the record (and its real slug) exists. */
  slug?: string;
  /** true (default) = property-style photo gallery, any number of images.
   * false = a single image (agent photo, blog cover) — picking a new file
   * replaces whatever was there, and the hidden field holds one URL rather
   * than a newline-joined list. */
  multiple?: boolean;
  /** When set, each thumbnail gets a "Set as floor plan" quick-action and
   * the chosen image's URL is exposed via a hidden input with this name —
   * omitted entirely for single-image uploads (agent photo, blog cover),
   * where "floor plan" has no meaning. */
  floorPlanFieldName?: string;
  defaultFloorPlan?: string;
};

const starIcon = (
  <path d="M12 3.5l2.47 5.11 5.53.62-4.13 3.86 1.1 5.53L12 15.77l-4.97 2.85 1.1-5.53-4.13-3.86 5.53-.62L12 3.5z" />
);
const floorPlanIcon = (
  <path d="M4 4h16v16H4V4zm0 8h9m-9 8v-8m16-4v12M13 12v8" />
);

/**
 * Drag-and-drop reordering (native HTML5 DnD, no extra dependency — this
 * project already avoids pulling in a library for things a handful of DOM
 * events cover) plus two quick per-image actions:
 *   - Set as cover: moves the image to the front of the list. Order IS the
 *     cover: PropertyCard/the property page both already just use
 *     images[0], so "cover" isn't a separate flag to track, just reordering.
 *   - Set as floor plan: marks one uploaded image as the floor plan,
 *     tracked as its own single-URL hidden field (floorPlanFieldName) so a
 *     future floor-plan viewer has a real value to read regardless of
 *     where that image sits in (or even if it's still in) the gallery.
 */
export function ImageUploader({
  name,
  defaultValue,
  folder,
  slug,
  multiple = true,
  floorPlanFieldName,
  defaultFloorPlan,
}: Props) {
  const reactId = useId();
  const [draftSlug] = useState(() => slug || `draft-${reactId.replace(/[^a-z0-9]/gi, "")}`);
  const [items, setItems] = useState<ImageItem[]>(
    (defaultValue ?? []).map((url, i) => ({ id: `existing-${i}`, url, status: "done" }))
  );
  const [floorPlanUrl, setFloorPlanUrl] = useState(defaultFloorPlan ?? "");
  const [dragId, setDragId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!previewUrl) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setPreviewUrl(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [previewUrl]);

  const doneItems = items.filter((i) => i.status === "done");
  const hiddenValue = multiple ? doneItems.map((i) => i.url).join("\n") : (doneItems[0]?.url ?? "");

  function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    // Single-image mode: a newly picked file replaces whatever was there,
    // matching how a plain <input type="file"> without `multiple` behaves.
    const files = multiple ? Array.from(fileList) : [fileList[0]];

    const newItems: ImageItem[] = files.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      url: URL.createObjectURL(file),
      status: "uploading",
    }));
    setItems((prev) => (multiple ? [...prev, ...newItems] : newItems));

    files.forEach((file, i) => {
      const item = newItems[i];
      uploadImageFile(file, folder, draftSlug)
        .then((publicUrl) => {
          URL.revokeObjectURL(item.url);
          setItems((prev) =>
            prev.map((p) => (p.id === item.id ? { ...p, url: publicUrl, status: "done" } : p))
          );
        })
        .catch((err) => {
          setItems((prev) =>
            prev.map((p) =>
              p.id === item.id
                ? { ...p, status: "error", error: err instanceof Error ? err.message : "Upload failed" }
                : p
            )
          );
        });
    });
  }

  function removeItem(id: string) {
    const target = items.find((p) => p.id === id);
    if (target) {
      if (target.status !== "done") URL.revokeObjectURL(target.url);
      if (target.url === floorPlanUrl) setFloorPlanUrl("");
    }
    setItems((prev) => prev.filter((p) => p.id !== id));
  }

  function makeCover(id: string) {
    setItems((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx <= 0) return prev;
      const next = [...prev];
      const [moved] = next.splice(idx, 1);
      next.unshift(moved);
      return next;
    });
  }

  function toggleFloorPlan(url: string) {
    setFloorPlanUrl((prev) => (prev === url ? "" : url));
  }

  function reorder(overId: string) {
    if (!dragId || dragId === overId) return;
    setItems((prev) => {
      const fromIdx = prev.findIndex((p) => p.id === dragId);
      const toIdx = prev.findIndex((p) => p.id === overId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
  }

  function handleDragOver(e: DragEvent) {
    // Required for onDrop to ever fire at all — browsers reject a drop on
    // any target whose dragover isn't explicitly prevented.
    e.preventDefault();
  }

  const uploading = items.some((i) => i.status === "uploading");

  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={hiddenValue} />
      {floorPlanFieldName && <input type="hidden" name={floorPlanFieldName} value={floorPlanUrl} />}

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-slate-300 rounded-lg px-4 py-6 text-center text-sm text-slate-500 cursor-pointer hover:border-brand-gold-dark hover:text-brand-navy transition-colors"
      >
        {multiple
          ? "Click to choose photos or drag them here — resized and compressed automatically before upload."
          : "Click to choose a photo or drag one here — resized and compressed automatically before upload."}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {multiple && items.length > 1 && (
        <p className="text-xs text-slate-500">
          Drag a photo to reorder — the first photo is the cover image shown on listing cards.
        </p>
      )}

      {items.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {items.map((item, index) => {
            const isCover = multiple && index === 0;
            const isFloorPlan = floorPlanFieldName && item.url === floorPlanUrl;
            return (
              <div
                key={item.id}
                draggable={multiple}
                onDragStart={() => setDragId(item.id)}
                onDragOver={handleDragOver}
                onDrop={() => reorder(item.id)}
                onDragEnd={() => setDragId(null)}
                onClick={() => item.status === "done" && setPreviewUrl(item.url)}
                className={`group relative aspect-square rounded overflow-hidden bg-slate-100 border transition-opacity ${
                  isFloorPlan ? "border-brand-teal" : isCover ? "border-brand-gold-dark" : "border-slate-200"
                } ${multiple ? "cursor-grab active:cursor-grabbing" : item.status === "done" ? "cursor-zoom-in" : ""} ${
                  dragId === item.id ? "opacity-40" : ""
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- admin-only preview, not the public site */}
                <img src={item.url} alt="" className="w-full h-full object-cover pointer-events-none" />

                {item.status === "uploading" && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs">
                    Uploading…
                  </div>
                )}
                {item.status === "error" && (
                  <div className="absolute inset-0 bg-red-900/70 flex items-center justify-center text-white text-[10px] px-1 text-center">
                    {item.error ?? "Failed"}
                  </div>
                )}

                {item.status === "done" && (
                  <>
                    {multiple && (
                      <div className="group/cover absolute top-1 left-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            makeCover(item.id);
                          }}
                          aria-label="Set as cover image"
                          title="Set as cover image"
                          className={`w-5 h-5 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
                            isCover ? "bg-brand-gold text-brand-navy" : "bg-black/60 text-white hover:bg-black/80"
                          }`}
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            {starIcon}
                          </svg>
                        </button>
                        <span className="pointer-events-none absolute left-0 top-6 z-10 w-max max-w-40 rounded bg-slate-900 px-2 py-1 text-[10px] text-white opacity-0 transition-opacity group-hover/cover:opacity-100">
                          {isCover ? "Cover image" : "Set as cover image"}
                        </span>
                      </div>
                    )}

                    {floorPlanFieldName && (
                      <div className="group/plan absolute bottom-1 right-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFloorPlan(item.url);
                          }}
                          aria-label="Set as floor plan"
                          title="Set as floor plan"
                          className={`w-5 h-5 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
                            isFloorPlan ? "bg-brand-teal text-white" : "bg-black/60 text-white hover:bg-black/80"
                          }`}
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            {floorPlanIcon}
                          </svg>
                        </button>
                        <span className="pointer-events-none absolute right-0 bottom-6 z-10 w-max max-w-40 rounded bg-slate-900 px-2 py-1 text-[10px] text-white opacity-0 transition-opacity group-hover/plan:opacity-100">
                          {isFloorPlan ? "Floor plan image" : "Set as floor plan"}
                        </span>
                      </div>
                    )}
                  </>
                )}

                <div className="group/delete absolute top-1 right-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeItem(item.id);
                    }}
                    aria-label="Remove image"
                    title="Remove image"
                    className="bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs leading-none hover:bg-black/80 cursor-pointer"
                  >
                    ×
                  </button>
                  <span className="pointer-events-none absolute right-0 top-6 z-10 w-max max-w-40 rounded bg-slate-900 px-2 py-1 text-[10px] text-white opacity-0 transition-opacity group-hover/delete:opacity-100">
                    Remove image
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {uploading && <p className="text-xs text-slate-500">Uploading and compressing…</p>}

      {previewUrl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
          onClick={() => setPreviewUrl(null)}
          className="fixed inset-0 z-70 flex items-center justify-center bg-black/80 p-6 cursor-zoom-out"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- admin-only preview, not the public site */}
          <img
            src={previewUrl}
            alt=""
            onClick={(e) => e.stopPropagation()}
            className="max-h-full max-w-full rounded object-contain cursor-default"
          />
          <button
            type="button"
            onClick={() => setPreviewUrl(null)}
            aria-label="Close preview"
            className="absolute top-4 right-4 bg-black/60 text-white rounded-full w-9 h-9 flex items-center justify-center text-xl leading-none hover:bg-black/80 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

export default ImageUploader;
