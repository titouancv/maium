import { Fragment } from "react";
import { cn } from "@/lib/utils";

const ROW_H = 1.25;

// From 1000 up, the value is shown abbreviated (1.2K, 15K, 3.4M…). A single
// decimal is kept only while the scaled value is < 10 (so "1.2K" but "15K"),
// matching the common social-count convention. A trailing ".0" is dropped ("1K",
// not "1.0K"). We floor (never round up) so the abbreviation never overstates the
// real count.
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
      // Drop a ".0" fraction: show "1K" instead of "1.0K".
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

// `position` is a monotonic, cumulative index (not a single 0-9 digit) so the
// column always rolls in one direction: passing from 9 to 0 continues upward
// instead of scrolling back down through 8,7,...,0. Each row shows `i % 10`.
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
  /** The value to display. Negative values and decimals are floored to a non-negative integer. */
  value: number;
  /**
   * Fixed number of digit columns to render. Leading columns collapse their
   * width (animating in) until the value reaches them, giving a smooth roll for
   * a bounded range (e.g. a 0-100 percentage). Omit to render exactly as many
   * columns as the current value needs (grows/shrinks with the magnitude).
   */
  maxDigits?: number;
  /** Optional leading symbol rendered before the digits (e.g. "+" / "-"). */
  prefix?: string;
  /** Optional trailing symbol rendered after the digits (e.g. "%"). */
  suffix?: string;
  /** Accessible/hover description (maps to the `title` attribute). */
  title?: string;
  className?: string;
}

/**
 * Renders an integer as a row of rolling digit columns: each digit smoothly
 * scrolls to its new value when `value` changes. Extracted from the home stats
 * cards and the progress-bar percentage so both share the same animation.
 *
 * From 1000 up, the value is shown abbreviated with a unit suffix (1.2K, 15K,
 * 3.4M…). Abbreviation is skipped when `maxDigits` is set (fixed-width ranges
 * such as a 0-100 percentage never reach that magnitude).
 */
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

        // With a fixed width (`maxDigits`), collapse leading columns until the
        // value reaches them so a new digit animates its width in.
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

        // Insert the decimal point just before the fractional column(s).
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
