import { motion } from "framer-motion";
import React from "react";

export interface TabsProps {
  tabs: string[];
  activeTab: number;
  onChange: (index: number) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className = "" }: TabsProps) {
  const isActive = (idx: number): boolean => {
    return activeTab === idx;
  };
  return (
    <div className={`flex overflow-x-auto hide-scrollbar gap-2 ${className}`}>
      {tabs.map((tab, idx) => (
        <button
          key={idx}
          onClick={() => onChange(idx)}
          className={`min-w-fit px-4 py-1 font-medium text-sm transition-colors rounded-full ${activeTab === idx ? "bg-primary text-on-primary" : "hover:bg-surface-100 text-txt-muted"}`}
        >
          <motion.span
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`relative z-10 ${
              isActive(idx) ? "text-on-primary" : "text-txt hover:text-primary"
            }`}
          >
            {tab}
          </motion.span>
          {isActive(idx) && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 bg-primary rounded-full"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
        </button>
      ))}
    </div>
  );
}
