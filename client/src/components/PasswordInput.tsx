"use client";

import { InputGroup } from "@heroui/react";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

interface PasswordInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  required?: boolean;
  placeholder?: string;
}

export function PasswordInput({
  id,
  value,
  onChange,
  autoComplete,
  required,
  placeholder,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <InputGroup.Root fullWidth>
      <InputGroup.Input
        id={id}
        type={visible ? "text" : "password"}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <InputGroup.Suffix>
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="flex items-center text-zinc-400 transition-colors hover:text-zinc-600"
          aria-label={visible ? "Hide password" : "Show password"}
          tabIndex={-1}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </InputGroup.Suffix>
    </InputGroup.Root>
  );
}
