import React from "react";

export type TitleSize = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
export interface TitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  size?: TitleSize;
  label: string;
}

export function Title({
  className = "",
  size = "h2",
  label,
  ...props
}: TitleProps) {
  const sizes = {
    h1: "text-3xl font-extrabold",
    h2: "text-2xl",
    h3: "text-xl",
    h4: "text-lg",
    h5: "text-base",
    h6: "text-sm",
  };

  const Tag = size;

  return (
    <div className={`flex flex-col ${className} gap-1`}>
      <div className="flex justify-start">
        <Tag className={`${sizes[size]}`} {...props}>
          {label}
        </Tag>
      </div>
      <div className="h-1 w-24 rounded-full bg-current"></div>
    </div>
  );
}
