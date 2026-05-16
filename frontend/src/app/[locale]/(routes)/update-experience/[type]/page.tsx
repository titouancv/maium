import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ExperienceContent } from "@/components/content/ExperienceContent";

type ExperienceType = "professional" | "educational";

export default async function Page({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  if (type !== "professional" && type !== "educational") notFound();

  return (
    <Suspense>
      <ExperienceContent type={type as ExperienceType} />
    </Suspense>
  );
}
