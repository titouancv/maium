import React from "react";
import { cn } from "@/lib/utils";

export type TitleSize = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
export interface TitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  size?: TitleSize;
  label: string;
}

const sizes: Record<TitleSize, string> = {
  h1: "text-3xl font-extrabold",
  h2: "text-2xl",
  h3: "text-xl",
  h4: "text-lg",
  h5: "text-base",
  h6: "text-sm",
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
      <div className="h-1 w-22 rounded-full bg-current"></div>
    </div>
  );
}
