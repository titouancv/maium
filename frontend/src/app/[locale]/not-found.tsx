"use client";

import { useTranslations } from "next-intl";
import { PageLayout } from "@/components/layout/PageLayout";
import Image from "next/image";

export default function NotFound() {
  const t = useTranslations("notFound");

  return (
    <PageLayout title={t("title")}>
      <div className="flex flex-1 flex-col items-center justify-center gap-8 md:flex-row">
        <p className="text-2xl md:text-4xl">{t("message")}</p>
        <Image
          src="https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExbHVhdmxxNjl5ZjY1bTh3OTVxYmVxeW1qamszazBraTZhcnFxdDN6NCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/f7N10M1qz4I2M29DNP/giphy.gif"
          alt="404"
          width={480}
          height={270}
          unoptimized
        />
      </div>
    </PageLayout>
  );
}
