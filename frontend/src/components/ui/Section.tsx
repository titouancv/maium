"use client";

import { Title } from "@/components/ui";

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

export const Section = ({ title, children }: SectionProps) => {
  return (
    <section className="flex flex-col gap-6">
      <Title label={title} size="h3" />
      {children}
    </section>
  );
};
