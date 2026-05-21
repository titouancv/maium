"use client";

import { useTranslations } from "next-intl";
import { FormLayout } from "@/components/layout/FormLayout";
import { DateForm } from "./DateForm";
import { FullNameForm } from "./FullNameForm";
import { KeysForm } from "./KeysForm";
import { LocationForm } from "./LocationForm";
import { PhoneNumberForm } from "./PhoneNumberForm";
import { SocialNetworkForm } from "./SocialNetworkForm";
import { UrlsForm } from "./UrlsForm";
import { TextForm } from "./TextForm";
import { LongTextForm } from "./LongTextForm";
import { DateRangeForm } from "./DateRangeForm";
import { ExperiencesForm } from "./ExperiencesForm";
import { HobbiesForm } from "./HobbiesForm";
import { PseudoForm } from "./PseudoForm";
import type { DateMode } from "@/components/ui/DateInput";
import type { Experience } from "@/types/experience";
import { HobbyData } from "../custom";

export type FormBaseProps = {
  title?: string;
  step: number;
  totalSteps: number;
  formId?: string;
  onPrimary?: () => void;
  onSecondary?: () => void;
  secondaryLabel?: string;
  primaryLabel?: string;
  primaryLoading?: boolean;
  isCancelable?: boolean;
  onCancel?: () => void;
  cancelLabel?: string;
};

export type FormValueMap = {
  date: { dob: string };
  fullName: { firstName: string; lastName: string };
  hobbies: HobbyData[];
  keys: string[];
  location: { location: string };
  phoneNumber: { phone: string };
  socialNetwork: string[];
  urls: string[];
  text: string;
  longText: string;
  dateRange: { startDate: string; endDate: string };
  experiences: Experience[];
  pseudo: { pseudo: string };
};

export type FormDefaultValueMap = {
  date: string;
  fullName: { firstName?: string; lastName?: string };
  hobbies: HobbyData[];
  keys: string[];
  location: string;
  phoneNumber: string;
  socialNetwork: string[];
  urls: string[];
  text: string;
  longText: string;
  dateRange: { defaultStartDate?: string; defaultEndDate?: string };
  experiences: Experience[];
  pseudo: string;
};

export type FormConfigMap = {
  date: never;
  fullName: never;
  hobbies: never;
  keys: { placeholder: string };
  location: never;
  phoneNumber: never;
  socialNetwork: never;
  urls: never;
  text: {
    placeholder: string;
    infoLabel?: string;
    infoType?: "error" | "success" | "info";
  };
  longText: {
    placeholder: string;
    infoLabel?: string;
    infoType?: "error" | "success" | "info";
    rows?: number;
  };
  dateRange: { mode?: DateMode; startError?: string; endError?: string };
  experiences: { namespace: string; dateMode?: "MM-YYYY" | "YYYY" };
  pseudo: never;
};

export type FormType = keyof FormValueMap;

export type FormProps = {
  [K in FormType]: FormBaseProps & {
    type: K;
    defaultValue?: FormDefaultValueMap[K];
    onChange: (value: FormValueMap[K]) => void;
  } & (FormConfigMap[K] extends never ? unknown : FormConfigMap[K]);
}[FormType];

const renderContent = (props: FormProps) => {
  switch (props.type) {
    case "date":
      return (
        <DateForm onChange={props.onChange} defaultValue={props.defaultValue} />
      );
    case "fullName":
      return (
        <FullNameForm
          onChange={props.onChange}
          defaultValue={props.defaultValue}
        />
      );
    case "keys":
      return (
        <KeysForm
          placeholder={props.placeholder}
          onChange={props.onChange}
          defaultValue={props.defaultValue}
        />
      );
    case "location":
      return (
        <LocationForm
          onChange={props.onChange}
          defaultValue={props.defaultValue}
        />
      );
    case "phoneNumber":
      return (
        <PhoneNumberForm
          onChange={props.onChange}
          defaultValue={props.defaultValue}
        />
      );
    case "socialNetwork":
      return (
        <SocialNetworkForm
          defaultValue={props.defaultValue}
          onChange={props.onChange}
        />
      );
    case "urls":
      return (
        <UrlsForm defaultValue={props.defaultValue} onChange={props.onChange} />
      );
    case "text":
      return (
        <TextForm
          placeholder={props.placeholder}
          defaultValue={props.defaultValue}
          onChange={props.onChange}
          infoLabel={props.infoLabel}
          infoType={props.infoType}
        />
      );
    case "longText":
      return (
        <LongTextForm
          placeholder={props.placeholder}
          defaultValue={props.defaultValue}
          onChange={props.onChange}
          infoLabel={props.infoLabel}
          infoType={props.infoType}
          rows={props.rows}
        />
      );
    case "dateRange":
      return (
        <DateRangeForm
          defaultValue={props.defaultValue}
          mode={props.mode}
          onChange={props.onChange}
          startError={props.startError}
          endError={props.endError}
        />
      );
    case "experiences":
      return (
        <ExperiencesForm
          namespace={props.namespace}
          dateMode={props.dateMode}
          defaultValue={props.defaultValue}
          onChange={props.onChange}
        />
      );
    case "pseudo":
      return (
        <PseudoForm
          onChange={props.onChange}
          defaultValue={props.defaultValue}
        />
      );
    case "hobbies":
      return (
        <HobbiesForm
          defaultValue={props.defaultValue}
          onChange={props.onChange}
        />
      );
  }
};

const getDefaultTitle = (
  props: FormProps,
  t: ReturnType<typeof useTranslations<"form">>,
): string => {
  switch (props.type) {
    case "fullName":
      return t("fullNameTitle");
    case "pseudo":
      return t("pseudoTitle");
    case "date":
      return t("dateTitle");
    case "phoneNumber":
      return t("phoneNumberTitle");
    case "location":
      return t("locationTitle");
    case "socialNetwork":
      return t("socialNetworkTitle");
    case "hobbies":
      return t("hobbiesTitle");
    case "keys":
      return t("keysTitle");
    case "urls":
      return t("urlsTitle");
    case "experiences":
      if (props.namespace === "experience.educational")
        return t("experiencesEducationalTitle");
      return t("experiencesProfessionalTitle");
    default:
      return "";
  }
};

export const Form = (props: FormProps) => {
  const t = useTranslations("form");
  const FormbaseProps: FormBaseProps = {
    title: props.title ?? getDefaultTitle(props, t),
    step: props.step,
    totalSteps: props.totalSteps,
    formId: props.formId,
    onPrimary: props.onPrimary,
    onSecondary: props.onSecondary,
    secondaryLabel: props.secondaryLabel,
    primaryLabel: props.primaryLabel,
    primaryLoading: props.primaryLoading,
    isCancelable: props.isCancelable,
    onCancel: props.onCancel,
    cancelLabel: props.cancelLabel,
  };

  return <FormLayout {...FormbaseProps}>{renderContent(props)}</FormLayout>;
};
