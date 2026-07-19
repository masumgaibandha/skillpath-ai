"use client";

import { Plus, X } from "lucide-react";

interface ListInputProps {
  value: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  addLabel: string;
}

export function ListInput({ value, onChange, placeholder, addLabel }: ListInputProps) {
  function updateAt(index: number, next: string) {
    onChange(value.map((item, i) => (i === index ? next : item)));
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-2">
      {value.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            type="text"
            value={item}
            placeholder={placeholder}
            onChange={(e) => updateAt(index, e.target.value)}
            className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 outline-none placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="button"
            onClick={() => removeAt(index)}
            aria-label="Remove item"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-red-600"
          >
            <X size={16} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...value, ""])}
        className="flex items-center gap-1.5 self-start rounded-md px-2 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
      >
        <Plus size={15} />
        {addLabel}
      </button>
    </div>
  );
}
