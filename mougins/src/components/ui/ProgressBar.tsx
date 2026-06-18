import { NumberRoller } from "./NumberRoller";

interface ProgressBarProps {
  value: number;
  label?: string;
}

export function ProgressBar({ value, label }: ProgressBarProps) {
  return (
    <div className="flex w-full items-end justify-between gap-2">
      <div className="flex w-[90%] flex-col gap-2 pb-1">
        {label && (
          <div className="flex items-center justify-between">
            <span className="text-txt text-sm">{label}</span>
          </div>
        )}
        <div className="h-1.5 w-full overflow-hidden rounded-full">
          <div
            className="bg-primary h-full rounded-full"
            style={{ width: `${value}%` }}
          />
        </div>
      </div>
      <NumberRoller
        value={value}
        maxDigits={3}
        suffix="%"
        className="text-txt-muted text-lg"
      />
    </div>
  );
}
