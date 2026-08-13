"use client";

import { Button } from "../ui";

interface SearchLayoutProps {
  searchInput: React.ReactNode;
  children?: React.ReactNode;
  onCancel?: () => void;
  cancelLabel?: string;
}

export const SearchLayout = ({
  searchInput,
  children,
  onCancel,
  cancelLabel,
}: SearchLayoutProps) => {
  return (
    <div className="bg-surface-50 flex h-dvh flex-col md:h-screen md:items-center md:justify-center">
      <div className="flex h-full w-full flex-col gap-4 px-4 md:h-screen md:max-w-xl md:px-0">
        <div className="flex shrink-0 items-center gap-4 pt-16">
          {searchInput}
          <Button variant="ghost" type="button" size="none" onClick={onCancel}>
            {cancelLabel}
          </Button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {children}
          <div className="h-24 shrink-0 md:h-32" />
        </div>
      </div>
    </div>
  );
};
