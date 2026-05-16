"use client";

import { useEffect, forwardRef, useImperativeHandle } from "react";
import { useForm, useFieldArray, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { type UserState, useUserStore } from "@/stores/useUserStore";
import { ROUTES } from "@/constants";
import { ExperienceList } from "../experience/ExperienceList";

const MONTH_YEAR = /^\d{4}-(0[1-9]|1[0-2])$/;
const YEAR = /^\d{4}$/;

export type ExperienceStepMode = "empty" | "list";
export interface ExperienceStepHandle { addEntry: () => void; }
export type { ExperienceStepHandle as Step4Handle };
export type { ExperienceStepMode as Step4Mode };

interface SharedProps {
  onNext: (d: Partial<UserState>) => void;
  onValidityChange?: (isValid: boolean) => void;
  onModeChange?: (mode: ExperienceStepMode) => void;
}

type Props = SharedProps & { type: "professional" | "educational" };

// ─── Generic inner component ──────────────────────────────────────────────────

type ItemRecord = Record<string, string>;
type FormItems = { items: ItemRecord[] };

interface ItemDisplay {
  title: string;
  subtitle: string;
  startPeriod: string;
  endPeriod?: string;
  presentLabel?: string;
}

interface StepConfig {
  resolver: Resolver<FormItems>;
  defaultValues: FormItems;
  baseUrl: string;
  addEntryLabel: string;
  editLabel: string;
  toStore: (items: ItemRecord[]) => Partial<UserState>;
  getDisplay: (item: ItemRecord) => ItemDisplay;
}

const ExperienceStepInner = forwardRef<
  ExperienceStepHandle,
  SharedProps & { config: StepConfig }
>(({ config, onNext, onValidityChange, onModeChange }, ref) => {
  const router = useRouter();

  const { control, handleSubmit, trigger, formState: { isValid } } = useForm<FormItems>({
    resolver: config.resolver,
    mode: "onChange",
    defaultValues: config.defaultValues,
  });

  const { fields } = useFieldArray({ control, name: "items" });
  const mode: ExperienceStepMode = fields.length === 0 ? "empty" : "list";

  useEffect(() => { trigger(); }, [trigger]);
  useEffect(() => { onValidityChange?.(isValid); }, [isValid, onValidityChange]);
  useEffect(() => { onModeChange?.(mode); }, [mode, onModeChange]);

  useImperativeHandle(ref, () => ({ addEntry: () => router.push(config.baseUrl) }), [router, config.baseUrl]);

  return (
    <form
      id="signup-step-form"
      onSubmit={handleSubmit((d) => onNext(config.toStore(d.items)))}
      className="flex flex-col gap-4"
    >
      {mode === "empty" && (
        <Button
          type="button"
          variant="outline"
          size="md"
          className="w-full"
          onClick={() => router.push(config.baseUrl)}
        >
          {config.addEntryLabel}
        </Button>
      )}
      {mode === "list" && (
        <ExperienceList
          fields={fields}
          control={control}
          getDisplay={config.getDisplay}
          editLabel={config.editLabel}
          onEdit={(index) => router.push(`${config.baseUrl}&index=${index}`)}
        />
      )}
    </form>
  );
});

ExperienceStepInner.displayName = "ExperienceStepInner";

// ─── Public component ─────────────────────────────────────────────────────────

export const StepExperience = forwardRef<ExperienceStepHandle, Props>(
  ({ type, onNext, onValidityChange, onModeChange }, ref) => {
    const isPro = type === "professional";
    const t = useTranslations(isPro ? "auth.signup.step5" : "auth.signup.step6");
    const { user } = useUserStore();

    const baseUrl = isPro
      ? `${ROUTES.UPDATE_EXPERIENCE_PRO}?returnUrl=${encodeURIComponent(`${ROUTES.SIGNUP}?step=4`)}`
      : `${ROUTES.UPDATE_EXPERIENCE_EDU}?returnUrl=${encodeURIComponent(`${ROUTES.SIGNUP}?step=5`)}`;

    const config: StepConfig = isPro
      ? {
          resolver: zodResolver(z.object({
            items: z.array(
              z.object({
                company: z.string().min(1, t("companyRequired")),
                role: z.string().min(1, t("roleRequired")),
                startDate: z.string().regex(MONTH_YEAR, t("startDateRequired")),
                endDate: z.union([z.string().regex(MONTH_YEAR, t("endDateRequired")), z.literal("")]).optional(),
              }).refine(
                (d) => !d.endDate || !MONTH_YEAR.test(d.endDate) || d.endDate >= d.startDate,
                { message: t("endDateBeforeStart"), path: ["endDate"] },
              ),
            ),
          })) as unknown as Resolver<FormItems>,
          defaultValues: {
            items: (user?.professionalExperiences ?? []).map((e) => ({
              company: e.company ?? "",
              role: e.role ?? "",
              startDate: e.startDate ?? "",
              endDate: e.endDate ?? "",
            })),
          },
          baseUrl,
          addEntryLabel: t("addEntry"),
          editLabel: t("editButton"),
          toStore: (items) => ({
            professionalExperiences: items.map((item) => ({
              company: item.company,
              role: item.role,
              startDate: item.startDate,
              endDate: item.endDate || undefined,
              current: !item.endDate,
            })),
          }),
          getDisplay: (item) => ({
            title: item.company,
            subtitle: item.role,
            startPeriod: item.startDate,
            endPeriod: item.endDate || undefined,
            presentLabel: t("presentLabel"),
          }),
        }
      : {
          resolver: zodResolver(z.object({
            items: z.array(
              z.object({
                school: z.string().min(1, t("schoolRequired")),
                fieldOfStudy: z.string().min(1, t("fieldOfStudyRequired")),
                description: z.string().max(500).or(z.literal("")),
                website: z.union([z.string().url({ message: t("websiteInvalid") }), z.literal("")]),
                startYear: z.string().regex(YEAR, t("startYearRequired")),
                endYear: z.union([z.string().regex(YEAR), z.literal("")]),
              }).refine(
                (d) => !d.endYear || !YEAR.test(d.endYear) || Number(d.endYear) >= Number(d.startYear),
                { message: t("endYearBeforeStart"), path: ["endYear"] },
              ),
            ),
          })) as unknown as Resolver<FormItems>,
          defaultValues: {
            items: (user?.educationalExperiences ?? []).map((e) => ({
              school: e.school ?? "",
              fieldOfStudy: e.fieldOfStudy ?? "",
              description: e.description ?? "",
              website: e.website ?? "",
              startYear: e.startYear ?? "",
              endYear: e.endYear ?? "",
            })),
          },
          baseUrl,
          addEntryLabel: t("addEntry"),
          editLabel: t("editButton"),
          toStore: (items) => ({
            educationalExperiences: items.map((item) => ({
              school: item.school,
              fieldOfStudy: item.fieldOfStudy,
              description: item.description || undefined,
              website: item.website || undefined,
              startYear: item.startYear,
              endYear: item.endYear || undefined,
            })),
          }),
          getDisplay: (item) => ({
            title: item.school,
            subtitle: item.fieldOfStudy,
            startPeriod: item.startYear,
            endPeriod: item.endYear || undefined,
          }),
        };

    return (
      <ExperienceStepInner
        ref={ref}
        config={config}
        onNext={onNext}
        onValidityChange={onValidityChange}
        onModeChange={onModeChange}
      />
    );
  },
);

StepExperience.displayName = "StepExperience";
