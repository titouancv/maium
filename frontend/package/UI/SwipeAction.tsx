import React from "react";

// Un simple wrapper CSS-only pour swipe
export function SwipeAction({ children, actionContent, onAction }: any) {
  return (
    <div className="group relative h-full w-full overflow-hidden">
      <div
        className="bg-error-50 text-error-600 border-error-400 absolute inset-y-0 right-0 flex w-24 translate-x-full cursor-pointer items-center justify-center border-l transition-transform group-hover:translate-x-0"
        onClick={onAction}
      >
        {actionContent || "Supprimer"}
      </div>
      <div className="bg-surface-50 transition-transform group-hover:-translate-x-24">
        {children}
      </div>
    </div>
  );
}
