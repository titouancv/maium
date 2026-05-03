import React from 'react';

export interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function MenuDrawer({ isOpen, onClose, children }: MenuDrawerProps) {
  if (!isOpen) return null;
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40 transition-opacity" onClick={onClose} />
      <div className="fixed top-0 left-0 bottom-0 w-64 bg-surface shadow-xl z-50 flex flex-col animate-slide-right">
        {children}
      </div>
    </>
  );
}