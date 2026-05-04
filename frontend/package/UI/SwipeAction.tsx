import React from "react";

// Un simple wrapper CSS-only pour swipe
export function SwipeAction({ children, actionContent, onAction }: any) {
  return (
    <div className="relative overflow-hidden w-full h-full group">
      <div
        className="absolute inset-y-0 right-0 w-24 bg-error-50 text-error-600 border-l border-error-400 flex items-center justify-center translate-x-full group-hover:translate-x-0 transition-transform cursor-pointer"
        onClick={onAction}
      >
        {actionContent || "Supprimer"}
      </div>
      <div className="group-hover:-translate-x-24 transition-transform bg-surface-50">
        {children}
      </div>
    </div>
  );
}
