"use client";

import { useTranslations } from "next-intl";
import { TabsVertical } from "@/components/ui/TabsVertical";
import { DREAM_WORK_MODES, type DreamWorkMode } from "@/constants";

interface Props {
  value: DreamWorkMode | null;
  onChange: (value: DreamWorkMode) => void;
}

export const DreamJobWorkModeField = ({ value, onChange }: Props) => {
  const tWorkMode = useTranslations("dreamWorkMode");
  const activeTab = value !== null ? DREAM_WORK_MODES.indexOf(value) : undefined;
  const tabs = DREAM_WORK_MODES.map((mode) => tWorkMode(mode));
  const handleChange = (index: number) => onChange(DREAM_WORK_MODES[index]);

  return (
    <div className="w-full">
      <TabsVertical tabs={tabs} activeTab={activeTab} onChange={handleChange} />
    </div>
  );
};
