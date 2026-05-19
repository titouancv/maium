"use client";

import { useState } from "react";
import { StepLayout } from "@/components/layout/StepLayout";
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

export type FormType =
  | "date"
  | "fullName"
  | "keys"
  | "location"
  | "phoneNumber"
  | "socialNetwork"
  | "urls"
  | "text"
  | "longText"
  | "dateRange"
  | "experiences";

type FormProps =
  | (BaseProps & {
      type: "date";
      onNext: (d: { dob: string }) => void;
      defaultDob?: string;
      onValidityChange?: (isValid: boolean) => void;
    })
  | (BaseProps & {
      type: "fullName";
      onNext: (d: { firstName: string; lastName: string }) => void;
      defaultFirstName?: string;
      defaultLastName?: string;
      onValidityChange?: (isValid: boolean) => void;
    })
  | (BaseProps & {
      type: "keys";
      placeholder: string;
      emptyLabel: string;
      onChange: (keys: string[]) => void;
      defaultKeys?: string[];
    })
  | (BaseProps & {
      type: "location";
      onNext: (d: { location: string }) => void;
      defaultLocation?: string;
      onValidityChange?: (isValid: boolean) => void;
    })
  | (BaseProps & {
      type: "phoneNumber";
      onNext: (d: { phone: string }) => void;
      defaultPhone?: string;
      onValidityChange?: (isValid: boolean) => void;
    })
  | (BaseProps & {
      type: "socialNetwork";
      defaultSocialNetworks?: string[];
      onChange: (socialNetworks: string[]) => void;
    })
  | (BaseProps & {
      type: "urls";
      defaultUrls?: string[];
      onChange: (urls: string[]) => void;
    })
  | (BaseProps & {
      type: "text";
      placeholder: string;
      defaultValue?: string;
      onChange: (value: string) => void;
      infoLabel?: string;
      infoType?: "error" | "success" | "info";
    })
  | (BaseProps & {
      type: "longText";
      placeholder: string;
      defaultValue?: string;
      onChange: (value: string) => void;
      infoLabel?: string;
      infoType?: "error" | "success" | "info";
      rows?: number;
    })
  | (BaseProps & {
      type: "dateRange";
      defaultStartDate?: string;
      defaultEndDate?: string;
      mode?: DateMode;
      onChange: (startDate: string, endDate: string) => void;
      startError?: string;
      endError?: string;
    })
  | (BaseProps & {
      type: "experiences";
      namespace: string;
      dateMode?: "MM-YYYY" | "YYYY";
      defaultExperiences?: Experience[];
      onChange: (experiences: Experience[]) => void;
    });

const renderContent = (
  props: FormProps,
  onSubFormChange: (active: boolean) => void,
) => {
  switch (props.type) {
    case "date":
      return (
        <DateForm
          onNext={props.onNext}
          defaultDob={props.defaultDob}
          onValidityChange={props.onValidityChange}
        />
      );
    case "fullName":
      return (
        <FullNameForm
          onNext={props.onNext}
          defaultFirstName={props.defaultFirstName}
          defaultLastName={props.defaultLastName}
          onValidityChange={props.onValidityChange}
        />
      );
    case "keys":
      return (
        <KeysForm
          placeholder={props.placeholder}
          emptyLabel={props.emptyLabel}
          onChange={props.onChange}
          defaultKeys={props.defaultKeys}
        />
      );
    case "location":
      return (
        <LocationForm
          onNext={props.onNext}
          defaultLocation={props.defaultLocation}
          onValidityChange={props.onValidityChange}
        />
      );
    case "phoneNumber":
      return (
        <PhoneNumberForm
          onNext={props.onNext}
          defaultPhone={props.defaultPhone}
          onValidityChange={props.onValidityChange}
        />
      );
    case "socialNetwork":
      return (
        <SocialNetworkForm
          defaultSocialNetworks={props.defaultSocialNetworks}
          onChange={props.onChange}
        />
      );
    case "urls":
      return (
        <UrlsForm defaultUrls={props.defaultUrls} onChange={props.onChange} />
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
          defaultStartDate={props.defaultStartDate}
          defaultEndDate={props.defaultEndDate}
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
          defaultExperiences={props.defaultExperiences}
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

  return <StepLayout {...baseProps}>{content}</StepLayout>;
};
