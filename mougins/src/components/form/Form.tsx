"use client";

import { useTranslations } from "next-intl";
import { FormLayout } from "@/components/layout/FormLayout";
import { DateForm } from "./DateForm";
import { FullNameForm } from "./FullNameForm";
import { KeysForm } from "./KeysForm";
import { LocationForm } from "./LocationForm";
import { PhoneNumberForm } from "./PhoneNumberForm";
import { SocialNetworkForm } from "./SocialNetworkForm";
import { TextForm } from "./TextForm";
import { LongTextForm } from "./LongTextForm";
import { DateRangeForm } from "./DateRangeForm";
import { ExperiencesForm } from "./ExperiencesForm";
import { HobbiesForm } from "./HobbiesForm";
import { ResumeHobbiesForm } from "./ResumeHobbiesForm";
import { PseudoForm } from "./PseudoForm";
import { SelectForm, type SelectOption } from "./SelectForm";
import { CvImportForm } from "./CvImportForm";
import { ProfilePhotoForm } from "./ProfilePhotoForm";
import { HobbyPlaceForm } from "./HobbyPlaceForm";
import { HobbyPersonalityForm } from "./HobbyPersonalityForm";
import { ProjectImageForm, type ProjectImageValue } from "./ProjectImageForm";
import { ProjectsForm } from "./ProjectsForm";
import type { DateMode } from "@/components/ui/DateInput";
import type { Experience } from "@/types/experience";
import type { CvExtraction } from "@/lib/validators/cv";
import { HobbyData, type Project } from "@/types/user";
import type { ResumeHobby } from "@/types/job";
import {
  EXPERIENCE_NAMESPACE,
  type ExperienceNamespace,
  type InfoType,
} from "@/constants";

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
  error?: string;
  isCancelable?: boolean;
  onCancel?: () => void;
  cancelLabel?: string;
};

export type FormValueMap = {
  date: { dob: number };
  fullName: { firstName: string; lastName: string };
  hobbies: HobbyData[];
  resumeHobbies: ResumeHobby[];
  keys: string[];
  location: { location: string };
  phoneNumber: { phone: string };
  socialNetwork: string[];
  text: string;
  longText: string;
  dateRange: { startDate: number | null; endDate: number | null };
  experiences: Experience[];
  pseudo: { pseudo: string };
  select: string;
  cvImport: CvExtraction;
  profilePhoto: string;
  hobbyPlace: { countryName: string; countryCode: string };
  hobbyPersonality: { title: string; imageUrl?: string; sourceUrl?: string };
  projects: Project[];
  projectImage: ProjectImageValue | null;
};

export type FormDefaultValueMap = {
  date: number | null;
  fullName: { firstName?: string; lastName?: string };
  hobbies: HobbyData[];
  resumeHobbies: ResumeHobby[];
  keys: string[];
  location: string;
  phoneNumber: string;
  socialNetwork: string[];
  text: string;
  longText: string;
  dateRange: {
    defaultStartDate?: number | null;
    defaultEndDate?: number | null;
  };
  experiences: Experience[];
  pseudo: string;
  select: string;
  cvImport: never;
  profilePhoto: string;
  hobbyPlace: { countryName: string; countryCode: string };
  hobbyPersonality: { title: string; imageUrl?: string; sourceUrl?: string };
  projects: Project[];
  projectImage: ProjectImageValue | null;
};

export type FormConfigMap = {
  date: never;
  fullName: never;
  hobbies: never;
  resumeHobbies: never;
  keys: { placeholder: string };
  location: { format?: "city-country" | "country" };
  phoneNumber: never;
  socialNetwork: never;
  text: {
    placeholder: string;
    infoLabel?: string;
    infoType?: InfoType;
  };
  longText: {
    placeholder: string;
    infoLabel?: string;
    infoType?: InfoType;
    rows?: number;
  };
  dateRange: { mode?: DateMode; startError?: string; endError?: string };
  experiences: {
    namespace: ExperienceNamespace;
    dateMode?: "MM-YYYY" | "YYYY";
  };
  pseudo: never;
  select: { options: SelectOption<string>[]; footer?: React.ReactNode };
  cvImport: never;
  profilePhoto: never;
  hobbyPlace: never;
  hobbyPersonality: never;
  projects: never;
  projectImage: never;
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
          format={props.format}
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
    case "text":
      return (
        <TextForm
          placeholder={props.placeholder}
          defaultValue={props.defaultValue}
          onChange={props.onChange}
          onPrimary={props.onPrimary}
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
          onPrimary={props.onPrimary}
          startError={props.startError}
          endError={props.endError}
        />
      );
    case "experiences":
      return (
        <ExperiencesForm
          key={props.namespace}
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
    case "select":
      return (
        <SelectForm
          options={props.options}
          defaultValue={props.defaultValue}
          onChange={props.onChange}
          footer={props.footer}
        />
      );
    case "hobbies":
      return (
        <HobbiesForm
          defaultValue={props.defaultValue}
          onChange={props.onChange}
        />
      );
    case "resumeHobbies":
      return (
        <ResumeHobbiesForm
          defaultValue={props.defaultValue}
          onChange={props.onChange}
        />
      );
    case "cvImport":
      return (
        <CvImportForm
          onChange={props.onChange}
          isSubmitting={props.primaryLoading}
        />
      );
    case "profilePhoto":
      return (
        <ProfilePhotoForm
          defaultValue={props.defaultValue}
          onChange={props.onChange}
          isSubmitting={props.primaryLoading}
        />
      );
    case "hobbyPlace":
      return (
        <HobbyPlaceForm
          defaultValue={props.defaultValue}
          onChange={props.onChange}
        />
      );
    case "hobbyPersonality":
      return (
        <HobbyPersonalityForm
          defaultValue={props.defaultValue}
          onChange={props.onChange}
        />
      );
    case "projects":
      return (
        <ProjectsForm
          defaultValue={props.defaultValue}
          onChange={props.onChange}
        />
      );
    case "projectImage":
      return (
        <ProjectImageForm
          defaultValue={props.defaultValue}
          onChange={props.onChange}
          isSubmitting={props.primaryLoading}
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
    case "resumeHobbies":
      return t("hobbiesTitle");
    case "keys":
      return t("keysTitle");
    case "projects":
      return t("projectsTitle");
    case "experiences":
      if (props.namespace === EXPERIENCE_NAMESPACE.educational)
        return t("experiencesEducationalTitle");
      return t("experiencesProfessionalTitle");
    case "cvImport":
      return t("cvImport.title");
    case "profilePhoto":
      return t("profilePhoto.title");
    default:
      return "";
  }
};

export const Form = (props: FormProps) => {
  const t = useTranslations("form");
  const FormbaseProps = {
    title: props.title ?? getDefaultTitle(props, t),
    step: props.step,
    totalSteps: props.totalSteps,
    formId: props.formId,
    onPrimary: props.onPrimary,
    onSecondary: props.onSecondary,
    secondaryLabel: props.secondaryLabel,
    primaryLabel: props.primaryLabel,
    primaryLoading: props.primaryLoading,
    error: props.error,
    isCancelable: props.isCancelable,
    onCancel: props.onCancel,
    cancelLabel: props.cancelLabel,
  };

  return <FormLayout {...FormbaseProps}>{renderContent(props)}</FormLayout>;
};
