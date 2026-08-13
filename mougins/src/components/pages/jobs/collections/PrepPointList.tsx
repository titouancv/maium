"use client";

import { useTranslations } from "next-intl";
import { EmptyState, Section, Text } from "@/components/ui";
import { PREP_POINT_KINDS, type PrepPoint } from "@/types/job";
import { PrepPointItem } from "../items/PrepPointItem";

interface PrepPointListProps {
  points: PrepPoint[];
}

export function PrepPointList({ points }: PrepPointListProps) {
  const t = useTranslations("jobs");

  const groups = PREP_POINT_KINDS.map((kind) => ({
    kind,
    points: points.filter((point) => point.kind === kind),
  })).filter((group) => group.points.length > 0);

  return (
    <Section title={t("detail.prep.title")}>
      <Text tone="muted" size="sm">
        {t("detail.prep.subtitle")}
      </Text>
      {groups.length === 0 ? (
        <EmptyState label={t("detail.prep.empty")} />
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <div key={group.kind} className="flex flex-col gap-3">
              <Text size="lg" tone="primary" className="font-extrabold">
                {t(`detail.prep.kind.${group.kind}`)}
              </Text>
              <ul className="flex flex-col gap-4">
                {group.points.map((point, index) => (
                  <PrepPointItem
                    key={`${point.title}-${index}`}
                    point={point}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}
