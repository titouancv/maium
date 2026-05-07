import { getTranslations } from "next-intl/server";
import { HomeContent } from "@/components/home/HomeContent";

export default async function HomePage() {
  const t = await getTranslations("home");

  return <HomeContent />;
}
