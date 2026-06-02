"use client";

import { cn } from "@/lib/utils";
import { Title } from "@/components/ui";

interface SectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const Section = ({ title, children, className }: SectionProps) => {
  return (
    <section className={cn("flex flex-col gap-6", className)}>
      <Title label={title} size="h3" />
      {children}
    </section>
  );
};
