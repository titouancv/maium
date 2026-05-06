import React from "react";
import { TextInput, TextInputProps } from "./TextInput";

export function SearchInput(props: TextInputProps) {
  return (
    <div className="relative w-full">
      <TextInput className="bg-surface-100 rounded-full pl-10" {...props} />
      <span className="text-txt-muted absolute top-3.5 left-4">🔍</span>
    </div>
  );
}
