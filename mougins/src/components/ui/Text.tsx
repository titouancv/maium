import React from "react";
import { cn } from "@/lib/utils";

export type TextTone = "default" | "muted" | "primary";
export type TextSize = "xs" | "sm" | "base" | "lg";

const TONES: Record<TextTone, string> = {
  default: "text-txt",
  muted: "text-txt-muted",
  primary: "text-primary",
};

const SIZES: Record<TextSize, string> = {
  xs: "text-xs",
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
};

export interface TextProps extends React.HTMLAttributes<HTMLElement> {
  as?: "p" | "span" | "div" | "li";
  tone?: TextTone;
  size?: TextSize;
  truncate?: boolean;
}

export function Text({
  as: Tag = "p",
  tone = "default",
  size = "base",
  truncate = false,
  className,
  children,
  ...props
}: TextProps) {
  return (
    <Tag
      className={cn(
        TONES[tone],
        SIZES[size],
        truncate && "min-w-0 truncate",
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
