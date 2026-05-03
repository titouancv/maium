import React from 'react';
import { BottomSheet } from './BottomSheet';

export function DropdownSheet({ isOpen, onClose, options, onSelect }: any) {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col">
        {options.map((opt: any, i: number) => (
          <button 
            key={i} 
            onClick={() => { onSelect(opt); onClose(); }} 
            className="flex items-center h-14 px-2 border-b border-border last:border-0 text-left text-text"
          >
            {opt.label || opt}
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}