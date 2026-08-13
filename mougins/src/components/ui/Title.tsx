import React from "react";
import { cn } from "@/lib/utils";
import { AccentBar } from "./AccentBar";

export type TitleSize = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
export interface TitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  size?: TitleSize;
  label: string;
}

const sizes: Record<TitleSize, string> = {
  h1: "text-3xl font-extrabold",
  h2: "text-2xl font-extrabold",
  h3: "text-xl font-extrabold",
  h4: "text-lg font-extrabold",
  h5: "text-base font-extrabold",
  h6: "text-sm font-extrabold",
};

export function Title({
  className = "",
  size = "h2",
  label,
  ...props
}: TitleProps) {
  const Tag = size;

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex justify-start">
        <Tag className={sizes[size]} {...props}>
          {label}
        </Tag>
      </div>
      <AccentBar />
    </div>
  );
}
