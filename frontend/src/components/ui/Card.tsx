import React from "react";
import { Title, TitleSize } from "./Title";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: "none" | "sm" | "md" | "lg";
  cardTitle?: string;
}

export function Card({
  className = "",
  padding = "md",
  cardTitle,
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
    <div className={` ${className} flex flex-col gap-4`} {...props}>
      {cardTitle && <Title size={cardTitleSize[padding]} label={cardTitle} />}
      {children}
    </div>
  );
}
