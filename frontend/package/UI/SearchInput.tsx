import React from "react";
import { TextInput, TextInputProps } from "./TextInput";

export function SearchInput(props: TextInputProps) {
  return (
    <div className="relative w-full">
      <TextInput
        className="bg-surface-200 inset-shadow-dark-900/40 dark:inset-shadow-dark-900 rounded-full pl-10 inset-shadow-sm"
        {...props}
      />
      <span className="text-txt-muted absolute top-3.5 left-4">🔍</span>
    </div>
  );
}
