"use client";

import { ImageOff, Plus, X } from "lucide-react";
import { useState } from "react";

interface ImageUrlListInputProps {
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
}

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function ImageUrlRow({
  url,
  index,
  onUpdate,
  onRemove,
}: {
  url: string;
  index: number;
  onUpdate: (index: number, value: string) => void;
  onRemove: (index: number) => void;
}) {
  const [broken, setBroken] = useState(false);
  const valid = isValidUrl(url);

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-zinc-200 bg-zinc-100">
        {url && valid && !broken ? (
          // Arbitrary user-supplied URL from any host — see the same
          // reasoning as the signup avatar preview for using a plain <img>.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt=""
            className="h-full w-full object-cover"
            onError={() => setBroken(true)}
            onLoad={() => setBroken(false)}
          />
        ) : (
          <ImageOff size={16} className="text-zinc-300" />
        )}
      </div>
      <input
        type="url"
        value={url}
        placeholder="https://images.unsplash.com/..."
        onChange={(e) => {
          setBroken(false);
          onUpdate(index, e.target.value);
        }}
        className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 outline-none placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
      />
      <button
        type="button"
        onClick={() => onRemove(index)}
        aria-label="Remove image"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-red-600"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export function ImageUrlListInput({ value, onChange, max = 4 }: ImageUrlListInputProps) {
  function updateAt(index: number, next: string) {
    onChange(value.map((item, i) => (i === index ? next : item)));
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-2">
      {value.map((url, index) => (
        <ImageUrlRow
          // eslint-disable-next-line react/no-array-index-key
          key={index}
          url={url}
          index={index}
          onUpdate={updateAt}
          onRemove={removeAt}
        />
      ))}
      <button
        type="button"
        onClick={() => onChange([...value, ""])}
        disabled={value.length >= max}
        className="flex items-center gap-1.5 self-start rounded-md px-2 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:text-zinc-300 disabled:hover:bg-transparent"
      >
        <Plus size={15} />
        Add image ({value.length}/{max})
      </button>
    </div>
  );
}
