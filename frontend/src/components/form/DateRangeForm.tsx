"use client";

import { useRef } from "react";
import { DateInput, DateMode } from "@/components/ui/DateInput";

interface DateRangeFormProps {
  defaultStartDate?: string;
  defaultEndDate?: string;
  mode?: DateMode;
  onChange: (startDate: string, endDate: string) => void;
  startError?: string;
  endError?: string;
}

export const DateRangeForm = ({
  defaultStartDate = "",
  defaultEndDate = "",
  mode = "MM-YYYY",
  onChange,
  startError,
  endError,
}: DateRangeFormProps) => {
  const endRef = useRef<HTMLInputElement>(null);
  const startDate = useRef(defaultStartDate);
  const endDate = useRef(defaultEndDate);

  const handleStartChange = (value: string) => {
    startDate.current = value;
    onChange(startDate.current, endDate.current);
  };

  const handleEndChange = (value: string) => {
    endDate.current = value;
    onChange(startDate.current, endDate.current);
  };

  return (
    <div className="flex w-full gap-2">
      <DateInput
        mode={mode}
        value={defaultStartDate}
        onChange={handleStartChange}
        error={startError}
        autoFocus
        onComplete={() => endRef.current?.focus()}
        onEnter={() => endRef.current?.focus()}
      />
      <DateInput
        ref={endRef}
        mode={mode}
        value={defaultEndDate}
        onChange={handleEndChange}
        error={endError}
      />
    </div>
  );
};
