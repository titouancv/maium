"use client";

import { useTranslations } from "next-intl";
import { Rail, Section, Text } from "@/components/ui";

interface RecruiterQuestionListProps {
  questions: string[];
}

export function RecruiterQuestionList({
  questions,
}: RecruiterQuestionListProps) {
  const t = useTranslations("jobs");

  if (questions.length === 0) return null;

  return (
    <Section title={t("detail.recruiterQuestions.title")}>
      <Text tone="muted" size="sm">
        {t("detail.recruiterQuestions.subtitle")}
      </Text>
      <ul className="flex flex-col gap-3">
        {questions.map((question, index) => (
          <li key={`${question}-${index}`} className="text-txt-muted flex gap-3">
            <Rail />
            <Text className="min-w-0">{question}</Text>
          </li>
        ))}
      </ul>
    </Section>
  );
}
