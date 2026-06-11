"use client";

import { useState, useEffect, useRef, forwardRef } from "react";
import { TextInput, TextInputProps } from "./TextInput";

export interface SearchInputProps extends Omit<TextInputProps, "onSelect"> {
  suggestions?: string[];
  onSelect?: (value: string) => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ suggestions = [], onSelect, onChange, ...props }, ref) => {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const isOpen = open && suggestions.length > 0;

    useEffect(() => {
      const handler = (e: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(e.target as Node)
        ) {
          setOpen(false);
        }
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
      <div ref={containerRef} className="relative w-full">
        <div className="flex w-full items-center gap-3">
          <div className="relative flex-1">
            <TextInput
              ref={ref}
              className="rounded-full pl-4"
              autoComplete="off"
              onChange={(e) => {
                setOpen(true);
                onChange?.(e);
              }}
              {...props}
            />
          </div>
        </div>
        {isOpen && (
          <ul className="absolute z-50 mt-1 w-full overflow-hidden rounded-sm backdrop-blur-sm">
            {suggestions.map((s) => (
              <li
                key={s}
                className="text-txt hover:bg-surface-100 cursor-pointer rounded-sm px-4 py-3 text-sm"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelect?.(s);
                  setOpen(false);
                }}
              >
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  },
);
SearchInput.displayName = "SearchInput";
