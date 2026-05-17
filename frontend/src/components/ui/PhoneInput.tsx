"use client";

import React, { forwardRef, useCallback, useLayoutEffect, useRef, useState } from "react";

// Format: +XX XXX XXX XXXX (12 digits max)
// Cursor positions in display string after n digits typed
// Display: `+XX XXX XXX XXXX`
//           0123456789012345
const MAX_DIGITS = 12;
const CURSOR_POS = [1, 2, 3, 5, 6, 7, 9, 10, 11, 13, 14, 15, 16];

function buildDisplay(digits: string): string {
  const g = (i: number) => digits[i] ?? "X";
  return `+${g(0)}${g(1)} ${g(2)}${g(3)}${g(4)} ${g(5)}${g(6)}${g(7)} ${g(8)}${g(9)}${g(10)}${g(11)}`;
}

function fromValue(val: string): string {
  return val.replace(/\D/g, "").slice(0, MAX_DIGITS);
}

function toValue(digits: string): string {
  return digits.length > 0 ? `+${digits}` : "";
}

interface PhoneInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onEnter?: () => void;
  onComplete?: () => void;
  name?: string;
  error?: string;
  autoFocus?: boolean;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, onBlur, onEnter, onComplete, name, error, autoFocus }, forwardedRef) => {
    const [digits, setDigits] = useState(() => fromValue(value ?? ""));
    const localRef = useRef<HTMLInputElement>(null);

    const getEl = () =>
      (forwardedRef as React.RefObject<HTMLInputElement>)?.current ?? localRef.current;

    useLayoutEffect(() => {
      const el = getEl();
      if (el) el.setSelectionRange(CURSOR_POS[digits.length], CURSOR_POS[digits.length]);
    });

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") { e.preventDefault(); onEnter?.(); return; }
      e.preventDefault();
      if (/^\d$/.test(e.key) && digits.length < MAX_DIGITS) {
        const next = digits + e.key;
        setDigits(next);
        onChange?.(toValue(next));
        if (next.length === MAX_DIGITS) onComplete?.();
      } else if (e.key === "Backspace" && digits.length > 0) {
        const next = digits.slice(0, -1);
        setDigits(next);
        onChange?.(toValue(next));
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.value.replace(/\D/g, "").slice(0, MAX_DIGITS);
      if (next !== digits) {
        setDigits(next);
        onChange?.(toValue(next));
        if (next.length === MAX_DIGITS) onComplete?.();
      }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const next = (digits + e.clipboardData.getData("text").replace(/\D/g, "")).slice(0, MAX_DIGITS);
      setDigits(next);
      onChange?.(toValue(next));
      if (next.length === MAX_DIGITS) onComplete?.();
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
          inputMode="tel"
          autoComplete="tel"
          autoFocus={autoFocus}
          value={buildDisplay(digits)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onChange={handleChange}
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
PhoneInput.displayName = "PhoneInput";
