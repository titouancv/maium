"use client";

import React, { forwardRef, useCallback, useLayoutEffect, useRef, useState } from "react";

interface DateInputProps {
  value?: string; // YYYY-MM-DD
  onChange?: (value: string) => void;
  onBlur?: () => void;
  name?: string;
  error?: string;
  autoComplete?: string;
  autoFocus?: boolean;
}

// Cursor position in "DD - MM - YYYY" after n digits typed
// "DD - MM - YYYY" → D=0, D=1, ' '=2, '-'=3, ' '=4, M=5, M=6, ' '=7, '-'=8, ' '=9, Y=10,11,12,13
const CURSOR_POS = [0, 1, 2, 6, 7, 11, 12, 13, 14];

function fromISO(iso: string): string {
  if (!iso || iso.length < 10) return "";
  return iso.slice(8, 10) + iso.slice(5, 7) + iso.slice(0, 4); // DDMMYYYY
}

function toISO(digits: string): string {
  if (digits.length < 8) return "";
  return `${digits.slice(4, 8)}-${digits.slice(2, 4)}-${digits.slice(0, 2)}`;
}

function buildDisplay(digits: string): string {
  const g = (i: number, ch: string) => digits[i] ?? ch;
  return `${g(0, "D")}${g(1, "D")} - ${g(2, "M")}${g(3, "M")} - ${g(4, "Y")}${g(5, "Y")}${g(6, "Y")}${g(7, "Y")}`;
}

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({ value, onChange, onBlur, name, error, autoComplete, autoFocus }, forwardedRef) => {
    const [digits, setDigits] = useState(() => fromISO(value ?? ""));
    const localRef = useRef<HTMLInputElement>(null);

    const getEl = () =>
      (forwardedRef as React.RefObject<HTMLInputElement>)?.current ?? localRef.current;

    useLayoutEffect(() => {
      const el = getEl();
      if (el) el.setSelectionRange(CURSOR_POS[digits.length], CURSOR_POS[digits.length]);
    }, [digits]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") return;
      e.preventDefault();
      if (/^\d$/.test(e.key) && digits.length < 8) {
        const next = digits + e.key;
        setDigits(next);
        onChange?.(toISO(next));
      } else if (e.key === "Backspace" && digits.length > 0) {
        const next = digits.slice(0, -1);
        setDigits(next);
        onChange?.(toISO(next));
      }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const next = (digits + e.clipboardData.getData("text").replace(/\D/g, "")).slice(0, 8);
      setDigits(next);
      onChange?.(toISO(next));
    };

    const resetCursor = () => {
      const el = getEl();
      if (el) el.setSelectionRange(CURSOR_POS[digits.length], CURSOR_POS[digits.length]);
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
          value={buildDisplay(digits)}
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
