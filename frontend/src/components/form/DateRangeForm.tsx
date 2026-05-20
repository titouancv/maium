"use client";

import { useRef } from "react";
import { DateInput, DateMode } from "@/components/ui/DateInput";

interface DateRangeFormProps {
  defaultValue?: { defaultStartDate?: string; defaultEndDate?: string };
  mode?: DateMode;
  onChange: (d: { startDate: string; endDate: string }) => void;
  startError?: string;
  endError?: string;
}

export const DateRangeForm = ({
  defaultValue = { defaultStartDate: "", defaultEndDate: "" },
  mode = "MM-YYYY",
  onChange,
  startError,
  endError,
}: DateRangeFormProps) => {
  const endRef = useRef<HTMLInputElement>(null);
  const startDate = useRef(defaultValue.defaultStartDate ?? "");
  const endDate = useRef(defaultValue.defaultEndDate ?? "");

  const handleStartChange = (value: string) => {
    startDate.current = value;
    onChange({ startDate: startDate.current, endDate: endDate.current });
  };

  const handleEndChange = (value: string) => {
    endDate.current = value;
    onChange({ startDate: startDate.current, endDate: endDate.current });
  };

  return (
    <div className="md:flex-1 md:flex md:flex-col md:justify-center">
      <div className="flex w-full gap-2">
        <DateInput
          mode={mode}
          value={defaultValue.defaultStartDate}
          onChange={handleStartChange}
          error={startError}
          autoFocus
          onComplete={() => endRef.current?.focus()}
          onEnter={() => endRef.current?.focus()}
        />
        <DateInput
          ref={endRef}
          mode={mode}
          value={defaultValue.defaultEndDate}
          onChange={handleEndChange}
          error={endError}
        />
      </div>
    </div>
  );
};
