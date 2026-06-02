const ROW_H = 1.25;
const DIGIT_MASK = {
  maskImage:
    "linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)",
  WebkitMaskImage:
    "linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)",
};

function DigitColumn({ digit, count }: { digit: number; count: number }) {
  return (
    <div
      className="relative overflow-hidden"
      style={{ height: `${ROW_H}em`, width: "1ch", ...DIGIT_MASK }}
    >
      <div
        className="absolute inset-x-0 transition-transform duration-300 ease-in-out"
        style={{ transform: `translateY(${-digit * ROW_H}em)` }}
      >
        {Array.from({ length: count }, (_, i) => (
          <div
            key={i}
            style={{ height: `${ROW_H}em` }}
            className="flex items-center justify-center"
          >
            {i}
          </div>
        ))}
      </div>
    </div>
  );
}

function PercentageRoller({ value }: { value: number }) {
  const integer = Math.floor(value);
  const hundreds = Math.floor(integer / 100);
  const tens = Math.floor((integer % 100) / 10);
  const units = integer % 10;

  return (
    <div className="text-txt-muted flex items-center text-lg tabular-nums">
      <div
        className="overflow-hidden transition-[width] duration-300 ease-in-out"
        style={{ width: integer >= 100 ? "1ch" : "0ch" }}
      >
        <DigitColumn digit={hundreds} count={2} />
      </div>
      <div
        className="overflow-hidden transition-[width] duration-300 ease-in-out"
        style={{ width: integer >= 10 ? "1ch" : "0ch" }}
      >
        <DigitColumn digit={tens} count={10} />
      </div>
      <DigitColumn digit={units} count={10} />
      <span>%</span>
    </div>
  );
}

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
      <PercentageRoller value={value} />
    </div>
  );
}
