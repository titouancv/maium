interface StepCounterProps {
  step: number;
  totalSteps: number;
}

export const StepCounter = ({ step, totalSteps }: StepCounterProps) => (
  <div
    className="relative -mt-2 h-14 w-4 overflow-hidden text-2xl"
    style={{
      maskImage:
        "linear-gradient(to bottom, transparent, black 20%, black 88%, transparent)",
      WebkitMaskImage:
        "linear-gradient(to bottom, transparent, black 20%, black 88%, transparent)",
    }}
  >
    <div
      className="absolute inset-x-0 top-0 transition-transform duration-300 ease-in-out"
      style={{
        transform: `translateY(${1 - (step - 1) * 1.5}rem)`,
      }}
    >
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
        <div
          key={s}
          className={`flex h-6 items-center justify-center font-black ${s === step ? "text-primary" : "text-txt"}`}
        >
          {s}
        </div>
      ))}
    </div>
  </div>
);
