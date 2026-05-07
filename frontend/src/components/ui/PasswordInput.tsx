"use client";
import React, { useState, forwardRef } from "react";
import { TextInput, TextInputProps } from "./TextInput";

export const PasswordInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ className, ...props }, ref) => {
    const [show, setShow] = useState(false);
    return (
      <div className="relative">
        <TextInput
          ref={ref}
          type={show ? "text" : "password"}
          className={`pr-12 ${className || ""}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="text-txt-muted absolute top-[34px] right-3 flex h-8 w-8 items-center justify-center"
        >
          {show ? "🙈" : "👁️"}
        </button>
      </div>
    );
  },
);
PasswordInput.displayName = "PasswordInput";
