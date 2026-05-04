import React from "react";
import { TextInput, TextInputProps } from "./TextInput";

export function SearchInput(props: TextInputProps) {
  return (
    <div className="relative w-full">
      <TextInput className="pl-10 rounded-full bg-surface-100" {...props} />
      <span className="absolute left-4 top-3.5 text-txt-muted">🔍</span>
    </div>
  );
}
