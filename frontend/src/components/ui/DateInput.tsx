"use client";

import React, { forwardRef, useCallback, useLayoutEffect, useRef, useState } from "react";

export type DateMode = "DD-MM-YYYY" | "MM-YYYY" | "YYYY";

interface DateInputProps {
  value?: string; // ISO format: YYYY-MM-DD | YYYY-MM | YYYY depending on mode
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onEnter?: () => void;
  name?: string;
  error?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  mode?: DateMode;
}

interface ModeConfig {
  maxDigits: number;
  cursorPos: number[];
  fromISO: (iso: string) => string;
  toISO: (digits: string) => string;
  buildDisplay: (digits: string) => string;
}

// Cursor position in display string after n digits typed
const MODE_CONFIGS: Record<DateMode, ModeConfig> = {
  "DD-MM-YYYY": {
    maxDigits: 8,
    // "DD - MM - YYYY" → D=0,D=1,' '=2,'-'=3,' '=4,M=5,M=6,' '=7,'-'=8,' '=9,Y=10..13
    cursorPos: [0, 1, 2, 6, 7, 11, 12, 13, 14],
    fromISO: (iso) => {
      if (!iso || iso.length < 10) return "";
      return iso.slice(8, 10) + iso.slice(5, 7) + iso.slice(0, 4);
    },
    toISO: (digits) => {
      if (digits.length < 8) return "";
      return `${digits.slice(4, 8)}-${digits.slice(2, 4)}-${digits.slice(0, 2)}`;
    },
    buildDisplay: (digits) => {
      const g = (i: number, ch: string) => digits[i] ?? ch;
      return `${g(0, "D")}${g(1, "D")} - ${g(2, "M")}${g(3, "M")} - ${g(4, "Y")}${g(5, "Y")}${g(6, "Y")}${g(7, "Y")}`;
    },
  },
  "MM-YYYY": {
    maxDigits: 6,
    // "MM - YYYY" → M=0,M=1,' '=2,'-'=3,' '=4,Y=5..8
    cursorPos: [0, 1, 2, 6, 7, 8, 9],
    fromISO: (iso) => {
      if (!iso || iso.length < 7) return "";
      return iso.slice(5, 7) + iso.slice(0, 4);
    },
    toISO: (digits) => {
      if (digits.length < 6) return "";
      return `${digits.slice(2, 6)}-${digits.slice(0, 2)}`;
    },
    buildDisplay: (digits) => {
      const g = (i: number, ch: string) => digits[i] ?? ch;
      return `${g(0, "M")}${g(1, "M")} - ${g(2, "Y")}${g(3, "Y")}${g(4, "Y")}${g(5, "Y")}`;
    },
  },
  YYYY: {
    maxDigits: 4,
    // "YYYY" → Y=0..3
    cursorPos: [0, 1, 2, 3, 4],
    fromISO: (iso) => {
      if (!iso || iso.length < 4) return "";
      return iso.slice(0, 4);
    },
    toISO: (digits) => {
      if (digits.length < 4) return "";
      return digits;
    },
    buildDisplay: (digits) => {
      const g = (i: number, ch: string) => digits[i] ?? ch;
      return `${g(0, "Y")}${g(1, "Y")}${g(2, "Y")}${g(3, "Y")}`;
    },
  },
};

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({ value, onChange, onBlur, onEnter, name, error, autoComplete, autoFocus, mode = "DD-MM-YYYY" }, forwardedRef) => {
    const config = MODE_CONFIGS[mode];
    const [digits, setDigits] = useState(() => config.fromISO(value ?? ""));
    const localRef = useRef<HTMLInputElement>(null);

    const getEl = () =>
      (forwardedRef as React.RefObject<HTMLInputElement>)?.current ?? localRef.current;

    useLayoutEffect(() => {
      const el = (forwardedRef as React.RefObject<HTMLInputElement>)?.current ?? localRef.current;
      if (el) el.setSelectionRange(config.cursorPos[digits.length], config.cursorPos[digits.length]);
    }, [digits, config.cursorPos, forwardedRef]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") { onEnter?.(); return; }
      e.preventDefault();
      if (/^\d$/.test(e.key) && digits.length < config.maxDigits) {
        const next = digits + e.key;
        setDigits(next);
        onChange?.(config.toISO(next));
      } else if (e.key === "Backspace" && digits.length > 0) {
        const next = digits.slice(0, -1);
        setDigits(next);
        onChange?.(config.toISO(next));
      }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const next = (digits + e.clipboardData.getData("text").replace(/\D/g, "")).slice(
        0,
        config.maxDigits,
      );
      setDigits(next);
      onChange?.(config.toISO(next));
    };

    const resetCursor = () => {
      const el = getEl();
      if (el) el.setSelectionRange(config.cursorPos[digits.length], config.cursorPos[digits.length]);
    };

    const mergeRef = useCallback(
      (el: HTMLInputElement | null) => {
        (localRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
        if (typeof forwardedRef === "function") forwardedRef(el);
        else if (forwardedRef)
          (forwardedRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
      },
      [forwardedRef],
    );

    return (
      <div className="flex w-full flex-col gap-1.5">
        <input
          ref={mergeRef}
          name={name}
          type="text"
          inputMode="numeric"
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          value={config.buildDisplay(digits)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onChange={() => {}}
          onClick={resetCursor}
          onFocus={resetCursor}
          onBlur={onBlur}
          className={`h-12 w-full transition-all ${
            error ? "text-error bg-error/10" : "text-txt hover:bg-surface-100 focus:bg-surface-100"
          } rounded-xl p-1 outline-none`}
        />
        {error && <span className="text-error pl-1 text-xs">{error}</span>}
      </div>
    );
  },
);
DateInput.displayName = "DateInput";
