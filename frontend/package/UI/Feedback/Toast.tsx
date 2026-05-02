import React from "react";

export function Toast({
  message,
  type = "info",
  isVisible,
}: {
  message: string;
  type?: "info" | "success" | "warning" | "error";
  isVisible: boolean;
}) {
  if (!isVisible) return null;

  const colors = {
    info: "bg-info-bg text-info-text border-info-border",
    success: "bg-success-bg text-success-text border-success-border",
    warning: "bg-warning-bg text-warning-text border-warning-border",
    error: "bg-error-bg text-error-text border-error-border",
  };

  return (
    <div className="fixed top-14 left-4 right-4 z-50 animate-slide-down">
      <div
        className={`${colors[type]} border px-4 py-3 rounded-sm shadow-lg flex items-center`}
      >
        {message}
      </div>
    </div>
  );
}
