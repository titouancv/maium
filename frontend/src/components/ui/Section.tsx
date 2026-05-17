import React from "react";
import { UISize } from "@/constants";
import { Title, TitleSize } from "./Title";

export interface SectionProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: UISize;
  title?: string;
}

export function Section({
  className = "",
  padding = "md",
  title,
  children,
  ...props
}: SectionProps) {
  const cardTitleSize: Record<UISize, TitleSize> = {
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
