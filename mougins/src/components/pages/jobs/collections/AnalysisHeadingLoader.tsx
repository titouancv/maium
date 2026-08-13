"use client";

import { use } from "react";
import type { AnalysisListItem } from "@/types/job";
import { AnalysisHeading } from "./AnalysisHeading";

interface AnalysisHeadingLoaderProps {
  analysisPromise: Promise<AnalysisListItem | null>;
}

export function AnalysisHeadingLoader({
  analysisPromise,
}: AnalysisHeadingLoaderProps) {
  const analysis = use(analysisPromise);
  if (!analysis) return null;

  return <AnalysisHeading analysis={analysis} />;
}
