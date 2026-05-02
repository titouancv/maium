import React from 'react';

export interface TabsProps {
  tabs: string[];
  activeTab: number;
  onChange: (index: number) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className = '' }: TabsProps) {
  return (
    <div className={`flex overflow-x-auto hide-scrollbar border-b border-border ${className}`}>
      {tabs.map((tab, idx) => (
        <button
          key={idx}
          onClick={() => onChange(idx)}
          className={`min-w-fit px-4 h-12 font-medium text-sm transition-colors border-b-2 ${activeTab === idx ? 'border-primary text-primary' : 'border-transparent text-text-muted'}`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}