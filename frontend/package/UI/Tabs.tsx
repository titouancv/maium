import React from "react";

export interface TabsProps {
  tabs: string[];
  activeTab: number;
  onChange: (index: number) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className = "" }: TabsProps) {
  return (
    <div className={`flex overflow-x-auto hide-scrollbar gap-2 ${className}`}>
      {tabs.map((tab, idx) => (
        <button
          key={idx}
          onClick={() => onChange(idx)}
          className={`min-w-fit px-4 py-1 font-medium text-sm transition-colors rounded-full ${activeTab === idx ? "bg-primary text-primary-text" : "hover:bg-surface-raised text-text-muted"}`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
