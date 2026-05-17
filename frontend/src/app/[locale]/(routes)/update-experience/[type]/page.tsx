import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ExperienceContent } from "@/components/content/ExperienceContent";
import { EXPERIENCE_TYPES, type ExperienceType } from "@/types/experience";

export default async function Page({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  if (!EXPERIENCE_TYPES.includes(type as ExperienceType)) notFound();

  return (
    <Suspense>
      <ExperienceContent type={type as ExperienceType} />
    </Suspense>
  );
}
