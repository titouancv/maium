import { Fragment } from "react";
import { cn } from "@/lib/utils";

const ROW_H = 1.25;

const ABBREVIATIONS = [
  { threshold: 1e12, symbol: "T" },
  { threshold: 1e9, symbol: "B" },
  { threshold: 1e6, symbol: "M" },
  { threshold: 1e3, symbol: "K" },
] as const;

function abbreviate(
  value: number,
): { displayInt: number; decimalPlaces: number; symbol: string } | null {
  for (const { threshold, symbol } of ABBREVIATIONS) {
    if (value >= threshold) {
      const scaled = value / threshold;
      let decimalPlaces = scaled < 10 ? 1 : 0;
      let displayInt = Math.floor(scaled * 10 ** decimalPlaces);
      if (decimalPlaces === 1 && displayInt % 10 === 0) {
        displayInt /= 10;
        decimalPlaces = 0;
      }
      return { displayInt, decimalPlaces, symbol };
    }
  }
  return null;
}
const DIGIT_MASK = {
  maskImage:
    "linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)",
  WebkitMaskImage:
    "linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)",
};

function DigitColumn({ position, length }: { position: number; length: number }) {
  return (
    <div
      className="relative overflow-hidden"
      style={{ height: `${ROW_H}em`, width: "1ch", ...DIGIT_MASK }}
    >
      <div
        className="absolute inset-x-0 transition-transform duration-300 ease-in-out"
        style={{ transform: `translateY(${-position * ROW_H}em)` }}
      >
        {Array.from({ length }, (_, i) => (
          <div
            key={i}
            style={{ height: `${ROW_H}em` }}
            className="flex items-center justify-center"
          >
            {i % 10}
          </div>
        ))}
      </div>
    </div>
  );
}

interface NumberRollerProps {
  value: number;
  maxDigits?: number;
  prefix?: string;
  suffix?: string;
  title?: string;
  className?: string;
}

export function NumberRoller({
  value,
  maxDigits,
  prefix,
  suffix,
  title,
  className,
}: NumberRollerProps) {
  const integer = Math.max(0, Math.floor(value));
  const abbr = maxDigits === undefined ? abbreviate(integer) : null;
  const rolled = abbr ? abbr.displayInt : integer;
  const decimalPlaces = abbr ? abbr.decimalPlaces : 0;
  const digits = maxDigits ?? String(rolled).length;

  return (
    <div className={cn("flex items-center tabular-nums", className)} title={title}>
      {prefix && <span>{prefix}</span>}
      {Array.from({ length: digits }, (_, i) => {
        const place = digits - 1 - i; // most significant digit first
        const divisor = 10 ** place;
        const position = Math.floor(rolled / divisor);
        const column = <DigitColumn position={position} length={position + 1} />;

        if (maxDigits !== undefined && place > 0) {
          return (
            <div
              key={place}
              className="overflow-hidden transition-[width] duration-300 ease-in-out"
              style={{ width: rolled >= divisor ? "1ch" : "0ch" }}
            >
              {column}
            </div>
          );
        }

        const needsDot = decimalPlaces > 0 && place === decimalPlaces - 1;
        return (
          <Fragment key={place}>
            {needsDot && <span>.</span>}
            <div>{column}</div>
          </Fragment>
        );
      })}
      {abbr && <span>{abbr.symbol}</span>}
      {suffix && <span>{suffix}</span>}
    </div>
  );
}
