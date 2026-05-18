import React from "react";
import { UI_VARIANTS, UIVariant, UISize } from "@/constants";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: UISize;
  variant?: UIVariant;
}

export function Card({
  className = "",
  padding = "md",
  variant = "outline",
  children,
  ...props
}: CardProps) {
  const baseStyle =
    "flex flex-col gap-4 rounded-md items-center justify-center";
  const cardPadding: Record<UISize, string> = {
    none: "",
    sm: "p-2",
    md: "p-4",
    lg: "p-6",
  };

  return (
    <section
      className={` ${className} ${cardPadding[padding]} ${UI_VARIANTS[variant]} ${baseStyle}`}
      {...props}
    >
      {children}
    </section>
  );
}
