import React from "react";

export interface TitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  variant?: "primary" | "secondary";
  size?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  label: string;
}

export function Title({
  className = "",
  variant = "primary",
  size = "h2",
  label,
  ...props
}: TitleProps) {
  const baseStyle =
    "inline-flex items-center justify-center rounded-xl font-medium transition-colors active:scale-95 disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    primary: "text-primary",
    secondary: "text-text",
  };
  const backgroundVariants = {
    primary: "bg-primary",
    secondary: "bg-text",
  };
  const sizes = {
    h1: "text-3xl font-bold",
    h2: "text-2xl font-bold",
    h3: "text-xl font-bold",
    h4: "text-lg font-bold",
    h5: "text-base font-bold",
    h6: "text-sm font-bold",
  };
  const backgroundSizes = {
    h1: "w-32",
    h2: "w-24",
    h3: "w-16",
    h4: "w-16",
    h5: "w-16",
    h6: "w-16",
  };

  const gapSizes = {
    h1: "gap-3",
    h2: "gap-3",
    h3: "gap-2",
    h4: "gap-2",
    h5: "gap-1",
    h6: "gap-1",
  };

  return (
    <div className={`flex flex-col ${className} ${gapSizes[size]}`} {...props}>
      <div className="flex justify-start">
        <span
          className={`${baseStyle} ${variants[variant]} ${sizes[size]}`}
          {...props}
        >
          {label}
        </span>
      </div>
      <div
        className={`${backgroundVariants[variant]} ${backgroundSizes[size]} h-1 rounded-full`}
      ></div>
    </div>
  );
}
