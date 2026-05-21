"use client";

import { useRef } from "react";
import { DateInput, DateMode } from "@/components/ui/DateInput";

interface DateRangeFormProps {
  defaultValue?: { defaultStartDate?: number | null; defaultEndDate?: number | null };
  mode?: DateMode;
  onChange: (d: { startDate: number | null; endDate: number | null }) => void;
  onPrimary?: () => void;
  startError?: string;
  endError?: string;
}

export const DateRangeForm = ({
  defaultValue = { defaultStartDate: null, defaultEndDate: null },
  mode = "MM-YYYY",
  onChange,
  onPrimary,
  startError,
  endError,
}: DateRangeFormProps) => {
  const endRef = useRef<HTMLInputElement>(null);
  const startDate = useRef<number | null>(defaultValue.defaultStartDate ?? null);
  const endDate = useRef<number | null>(defaultValue.defaultEndDate ?? null);

  const handleStartChange = (value: number | null) => {
    startDate.current = value;
    onChange({ startDate: startDate.current, endDate: endDate.current });
  };

  const handleEndChange = (value: number | null) => {
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
          onComplete={onPrimary}
          onEnter={onPrimary}
        />
      </div>
    </div>
  );
};
