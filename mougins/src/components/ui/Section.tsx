import { cn } from "@/lib/utils";
import { Title, type TitleSize } from "@/components/ui";

interface SectionProps {
  title: string;
  titleSize?: TitleSize;
  children: React.ReactNode;
  className?: string;
}

export const Section = ({
  title,
  titleSize = "h3",
  children,
  className,
}: SectionProps) => {
  return (
    <section className={cn("flex flex-col gap-6", className)}>
      <Title label={title} size={titleSize} />
      {children}
    </section>
  );
};
