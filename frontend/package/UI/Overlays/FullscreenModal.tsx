import React from 'react';

export interface FullscreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function FullscreenModal({ isOpen, onClose, title, children }: FullscreenModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-[var(--color-surface)] z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
        <span className="font-semibold text-lg">{title}</span>
        <button onClick={onClose} className="p-2 -mr-2 text-[var(--color-text-muted)]">Fermer</button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>
    </div>
  );
}