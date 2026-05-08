import React from "react";
import { Title, TitleSize } from "./Title";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: "none" | "sm" | "md" | "lg";
  title?: string;
}

export function Section({
  className = "",
  padding = "md",
  title,
  children,
  ...props
}: CardProps) {
  const cardTitleSize: { [key in "none" | "sm" | "md" | "lg"]: TitleSize } = {
    none: "h4",
    sm: "h3",
    md: "h3",
    lg: "h2",
  };

  return (
    <section className={` ${className} flex flex-col gap-4`} {...props}>
      {title && <Title size={cardTitleSize[padding]} label={title} />}
      {children}
    </section>
  );
}
