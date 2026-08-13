"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";

export interface FilePickerHandle {
  /** Opens the OS file dialog. */
  open: () => void;
}

interface FilePickerProps {
  /** `accept` attribute — e.g. `CV_ACCEPT_ATTRIBUTE`, `"image/*"`. */
  accept: string;
  /** Fired with the chosen file. Picking the same file twice fires twice. */
  onPick: (file: File) => void;
}

/**
 * The hidden `<input type="file">` behind a normal [Button]. Renders nothing
 * visible; hold a ref and call `open()` from as many triggers as you need.
 *
 * ```tsx
 * const picker = useRef<FilePickerHandle>(null);
 * <Button onClick={() => picker.current?.open()}>{t("choose")}</Button>
 * <FilePicker ref={picker} accept={CV_ACCEPT_ATTRIBUTE} onPick={handleFile} />
 * ```
 */
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
