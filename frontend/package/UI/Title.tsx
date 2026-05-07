import React from "react";

export type TitleSize = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
export interface TitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  variant?: "primary" | "neutral";
  size?: TitleSize;
  label: string;
}

export function Title({
  className = "",
  variant = "neutral",
  size = "h2",
  label,
  ...props
}: TitleProps) {
  const variants = {
    primary: "text-primary",
    neutral: "text-txt",
  };
  const sizes = {
    h1: "text-3xl font-extrabold",
    h2: "text-2xl font-bold",
    h3: "text-xl font-bold",
    h4: "text-lg font-bold",
    h5: "text-base font-bold",
    h6: "text-sm font-bold",
  };
  const barColors = {
    primary: "bg-primary",
    neutral: "bg-txt",
  };

  const Tag = size;

  return (
    <div className={`flex flex-col ${className} gap-1`}>
      <div className="flex justify-start">
        <Tag className={`${variants[variant]} ${sizes[size]}`} {...props}>
          {label}
        </Tag>
      </div>
      <div className={`${barColors[variant]} h-1 w-24 rounded-full`}></div>
    </div>
  );
}
