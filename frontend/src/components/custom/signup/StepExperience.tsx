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
import { ExperienceFormData } from "../experience/ExperienceSubWizard";
import { ExperienceSchema } from "@/lib/validators/user";

export type ExperienceStepMode = "empty" | "list";
export interface ExperienceStepHandle {
  addEntry: () => void;
}
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

interface StepConfig {
  resolver: Resolver<FormItems>;
  defaultValues: FormItems;
  baseUrl: string;
  addEntryLabel: string;
  editLabel: string;
  toStore: (items: ItemRecord[]) => Partial<UserState>;
  getDisplay: (item: ItemRecord) => ExperienceFormData;
}

const ExperienceStepInner = forwardRef<
  ExperienceStepHandle,
  SharedProps & { config: StepConfig }
>(({ config, onNext, onValidityChange, onModeChange }, ref) => {
  const router = useRouter();

  const {
    control,
    handleSubmit,
    trigger,
    formState: { isValid },
  } = useForm<FormItems>({
    resolver: config.resolver,
    mode: "onChange",
    defaultValues: config.defaultValues,
  });

  const { fields } = useFieldArray({ control, name: "items" });
  const mode: ExperienceStepMode = fields.length === 0 ? "empty" : "list";

  useEffect(() => {
    trigger();
  }, [trigger]);
  useEffect(() => {
    onValidityChange?.(isValid);
  }, [isValid, onValidityChange]);
  useEffect(() => {
    onModeChange?.(mode);
  }, [mode, onModeChange]);

  useImperativeHandle(
    ref,
    () => ({ addEntry: () => router.push(config.baseUrl) }),
    [router, config.baseUrl],
  );

  return (
    <form
      id="signup-step-form"
      onSubmit={handleSubmit((d) => onNext(config.toStore(d.items)))}
      className="flex flex-col gap-4"
    >
      {mode === "empty" && (
        <div className="">
          <Button
            type="button"
            variant="outline"
            size="md"
            className="w-full"
            onClick={() => router.push(config.baseUrl)}
          >
            {config.addEntryLabel}
          </Button>
        </div>
      )}
      {mode === "list" && (
        <ExperienceList
          fields={fields}
          control={control}
          getDisplay={config.getDisplay}
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
    const t = useTranslations(
      isPro ? "experience.professional" : "experience.educational",
    );
    const tCommon = useTranslations("common");
    const { user } = useUserStore();
    const baseUrl = isPro
      ? `${ROUTES.UPDATE_EXPERIENCE_PRO}?returnUrl=${encodeURIComponent(`${ROUTES.SIGNUP}?step=4`)}`
      : `${ROUTES.UPDATE_EXPERIENCE_EDU}?returnUrl=${encodeURIComponent(`${ROUTES.SIGNUP}?step=5`)}`;

    const experiences = isPro
      ? user?.professionalExperiences
      : user?.educationalExperiences;

    const config: StepConfig = {
      resolver: zodResolver(
        z.object({ items: z.array(ExperienceSchema) }),
      ) as unknown as Resolver<FormItems>,
      defaultValues: {
        items: (experiences ?? []).map((e) => ({
          organization: e.organization ?? "",
          role: e.role ?? "",
          startPeriod: e.startPeriod ?? "",
          endPeriod: e.endPeriod ?? "",
          description: e.description ?? "",
          website: e.website ?? "",
          location: e.location ?? "",
        })),
      },
      baseUrl,
      addEntryLabel: t("addEntry"),
      editLabel: tCommon("editButton"),
      toStore: (items) => ({
        [isPro ? "professionalExperiences" : "educationalExperiences"]:
          items.map((item) => ({
            organization: item.organization,
            role: item.role,
            startPeriod: item.startPeriod,
            endPeriod: item.endPeriod || undefined,
            description: item.description || undefined,
            website: item.website || undefined,
            location: item.location || undefined,
          })),
      }),
      getDisplay: (item) => ({
        organization: item.organization,
        role: item.role,
        startPeriod: item.startPeriod,
        endPeriod: item.endPeriod || undefined,
        location: item.location,
        website: item.website,
        description: item.description,
      }),
    };

    return (
      <ExperienceStepInner
        key={config.defaultValues.items.length}
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
