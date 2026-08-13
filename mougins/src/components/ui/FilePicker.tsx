"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";

export interface FilePickerHandle {
  open: () => void;
}

interface FilePickerProps {
  accept: string;
  onPick: (file: File) => void;
}

export const FilePicker = forwardRef<FilePickerHandle, FilePickerProps>(
  ({ accept, onPick }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
      open: () => inputRef.current?.click(),
    }));

    return (
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = ""; // allow re-picking the same file
          if (file) onPick(file);
        }}
      />
    );
  },
);
FilePicker.displayName = "FilePicker";
