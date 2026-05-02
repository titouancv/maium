import React from 'react';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function BottomSheet({ isOpen, onClose, children }: BottomSheetProps) {
  if (!isOpen) return null;
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 bg-surface-raised rounded-t-sm z-50 px-4 pb-safe animated-slide-up">
        <div className="w-12 h-1.5 bg-border-strong rounded-full mx-auto my-3" />
        <div className="pb-6">{children}</div>
      </div>
    </>
  );
}