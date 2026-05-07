import { getTranslations } from "next-intl/server";

export default async function HomePage() {
  const t = await getTranslations("home");

  return (
    <>
      <div className="pointer-events-none absolute top-0 left-0 z-50 p-4 text-sm opacity-50">
        {t("title")} - {t("description")}
      </div>
    </>
  );
}
