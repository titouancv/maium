"use client";

import { useState } from "react";
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
import type { HobbyData } from "@/components/ui/custom/settings/HobbySubForm";
import type { DateMode } from "@/components/ui/DateInput";
import type { Experience } from "@/types/experience";

type BaseProps = {
  title: string;
  step: number;
  totalSteps: number;
  formId?: string;
  onPrimary?: () => void;
  onSecondary?: () => void;
  secondaryLabel?: string;
  primaryLabel?: string;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
  centerContent?: boolean;
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
  keys: { placeholder: string; emptyLabel: string };
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
  [K in FormType]: BaseProps & {
    type: K;
    defaultValue?: FormDefaultValueMap[K];
    onChange: (value: FormValueMap[K]) => void;
    onValidityChange?: (isValid: boolean) => void;
  } & (FormConfigMap[K] extends never ? unknown : FormConfigMap[K]);
}[FormType];

const renderContent = (
  props: FormProps,
  onSubFormChange: (active: boolean) => void,
) => {
  switch (props.type) {
    case "date":
      return (
        <DateForm
          onChange={props.onChange}
          defaultValue={props.defaultValue}
          onValidityChange={props.onValidityChange}
        />
      );
    case "fullName":
      return (
        <FullNameForm
          onChange={props.onChange}
          defaultValue={props.defaultValue}
          onValidityChange={props.onValidityChange}
        />
      );
    case "keys":
      return (
        <KeysForm
          placeholder={props.placeholder}
          emptyLabel={props.emptyLabel}
          onChange={props.onChange}
          defaultValue={props.defaultValue}
        />
      );
    case "location":
      return (
        <LocationForm
          onChange={props.onChange}
          defaultValue={props.defaultValue}
          onValidityChange={props.onValidityChange}
        />
      );
    case "phoneNumber":
      return (
        <PhoneNumberForm
          onChange={props.onChange}
          defaultValue={props.defaultValue}
          onValidityChange={props.onValidityChange}
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
          onSubFormChange={onSubFormChange}
        />
      );
    case "pseudo":
      return (
        <PseudoForm
          onChange={props.onChange}
          defaultValue={props.defaultValue}
          onValidityChange={props.onValidityChange}
        />
      );
    case "hobbies":
      return (
        <HobbiesForm
          defaultValue={props.defaultValue}
          onChange={props.onChange}
          onSubFormChange={onSubFormChange}
        />
      );
  }
};

export const Form = (props: FormProps) => {
  const [isSubFormActive, setIsSubFormActive] = useState(false);

  const baseProps: BaseProps = {
    title: props.title,
    step: props.step,
    totalSteps: props.totalSteps,
    formId: props.formId,
    onPrimary: props.onPrimary,
    onSecondary: props.onSecondary,
    secondaryLabel: props.secondaryLabel,
    primaryLabel: props.primaryLabel,
    primaryDisabled: props.primaryDisabled,
    primaryLoading: props.primaryLoading,
    centerContent: props.centerContent,
    isCancelable: props.isCancelable,
    onCancel: props.onCancel,
    cancelLabel: props.cancelLabel,
  };

  const content = renderContent(props, setIsSubFormActive);

  if (isSubFormActive) return content;

  return <FormLayout {...baseProps}>{content}</FormLayout>;
};
