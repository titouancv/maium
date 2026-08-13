"use client";

import { useTranslations } from "next-intl";
import { Rail, Text } from "@/components/ui";
import { Icon } from "@/components/ui/icons";
import { prepResourceUrl } from "@/lib/jobs/resources";
import type { PrepPoint } from "@/types/job";

interface PrepPointItemProps {
  point: PrepPoint;
}

export function PrepPointItem({ point }: PrepPointItemProps) {
  const t = useTranslations("jobs");
  const href = prepResourceUrl(point);

  return (
    <li className="text-txt-muted flex gap-3">
      <Rail />
      <div className="flex min-w-0 flex-col gap-1">
        <Text className="font-extrabold">{point.title}</Text>
        {point.detail && (
          <Text size="sm" className="leading-relaxed">
            {point.detail}
          </Text>
        )}
        {href && (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-txt-muted hover:text-primary inline-flex w-fit items-center gap-1.5 text-sm transition-colors"
          >
            {t(`detail.prep.resource.${point.resource_kind}`)}
            <Icon name="externalLink" size={13} />
          </a>
        )}
      </div>
    </li>
  );
}
