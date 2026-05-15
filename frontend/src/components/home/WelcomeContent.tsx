"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Title } from "@/components/ui";
import { ROUTES } from "@/constants";

interface WelcomeContentProps {
  firstName: string;
  lastName: string;
  pseudo: string;
  dob: string;
  email: string;
  professionalExperiences: unknown[];
  educationalExperiences: unknown[];
}

export const WelcomeContent = ({
  firstName,
  lastName,
  pseudo,
  dob,
  email,
  professionalExperiences,
  educationalExperiences,
}: WelcomeContentProps) => {
  const t = useTranslations("welcome");
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-6">
      <div className="flex flex-col items-center gap-2">
        <Title label={t("greeting", { name: firstName })} size="h1" />
        <p className="text-txt-muted">{t("subtitle")}</p>
      </div>

      <div className="flex w-full flex-col gap-4 md:max-w-lg">
        <Card padding="lg" variant="outline" className="items-start">
          <h2 className="font-semibold text-txt">{t("personalInfo")}</h2>
          <ul className="w-full space-y-2 text-sm">
            <li>
              <span className="text-txt-muted">{t("email")}:</span> {email}
            </li>
            <li>
              <span className="text-txt-muted">{t("name")}:</span> {firstName}{" "}
              {lastName}
            </li>
            <li>
              <span className="text-txt-muted">{t("pseudo")}:</span> {pseudo}
            </li>
            <li>
              <span className="text-txt-muted">{t("dob")}:</span> {dob}
            </li>
          </ul>
        </Card>

        <Card padding="lg" variant="outline" className="items-start">
          <h2 className="font-semibold text-txt">{t("professionalExperience")}</h2>
          {professionalExperiences.length === 0 ? (
            <p className="text-sm text-txt-muted">{t("noExperiences")}</p>
          ) : (
            <ul className="w-full space-y-2 text-sm">
              {professionalExperiences.map((exp, i) => (
                <li key={i}>{JSON.stringify(exp)}</li>
              ))}
            </ul>
          )}
        </Card>

        <Card padding="lg" variant="outline" className="items-start">
          <h2 className="font-semibold text-txt">{t("educationalExperience")}</h2>
          {educationalExperiences.length === 0 ? (
            <p className="text-sm text-txt-muted">{t("noExperiences")}</p>
          ) : (
            <ul className="w-full space-y-2 text-sm">
              {educationalExperiences.map((exp, i) => (
                <li key={i}>{JSON.stringify(exp)}</li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Button onClick={() => router.push(ROUTES.HOME)}>{t("enterApp")}</Button>
    </div>
  );
};
