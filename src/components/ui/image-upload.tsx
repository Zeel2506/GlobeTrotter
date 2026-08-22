"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "./button";
import { ImageFallback } from "@/components/image-fallback";
import { cn } from "@/lib/cn";

/** The API caps coverPhotoUrl / photoUrl at 2 MB of base64 (docs/API_CONTRACT.md).
 *  base64 inflates by ~4/3, so the raw file ceiling is lower than 2 MB. */
const MAX_ENCODED_BYTES = 2 * 1024 * 1024;
const MAX_RAW_BYTES = Math.floor(MAX_ENCODED_BYTES * 0.74);

export function ImageUploadField({
  value,
  onChange,
  name,
  label = "Cover photo",
  className,
}: {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  /** Used for the gradient fallback preview when no image is chosen yet. */
  name: string;
  label?: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  function onPick(file: File | undefined) {
    setError(null);
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("That file is not an image.");
      return;
    }
    // Reject before encoding — no point base64-ing a file we will refuse.
    if (file.size > MAX_RAW_BYTES) {
      setError(`Image must be under ${Math.floor(MAX_RAW_BYTES / 1024 / 1024)} MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => setError("Could not read that file.");
    reader.onload = () => {
      const result = String(reader.result);
      if (result.length > MAX_ENCODED_BYTES) {
        setError("Image is too large once encoded. Try a smaller one.");
        return;
      }
      onChange(result);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-[13px] font-medium">{label}</span>

      <div className="flex items-center gap-3">
        <ImageFallback
          src={value}
          name={name || "Your trip"}
          variant="trip"
          className="aspect-[16/10] w-32 shrink-0 rounded-[var(--radius)]"
        />

        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => onPick(e.target.files?.[0])}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => inputRef.current?.click()}
          >
            <ImagePlus />
            {value ? "Replace" : "Upload"}
          </Button>
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onChange(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
            >
              <X />
              Remove
            </Button>
          )}
        </div>
      </div>

      {error ? (
        <p className="text-[13px] text-danger">{error}</p>
      ) : (
        <p className="text-[13px] text-foreground-subtle">
          Optional. We show a generated cover if you skip it.
        </p>
      )}
    </div>
  );
}
