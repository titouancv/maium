import { motion } from "framer-motion";
import React from "react";

export interface TabsProps {
  tabs: string[];
  activeTab: number;
  onChange: (index: number) => void;
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  const isActive = (idx: number): boolean => {
    return activeTab === idx;
  };
  return (
    <div className="hide-scrollbar flex gap-2 overflow-x-auto">
      {tabs.map((tab, idx) => (
        <button
          key={idx}
          onClick={() => onChange(idx)}
          className={`relative px-4 py-1 font-bold whitespace-nowrap`}
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
              className="from-secondary-400 to-primary inset-shadow-light-100/60 absolute inset-0 rounded-full bg-radial from-10% to-90% shadow-md inset-shadow-sm"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
        </button>
      ))}
    </div>
  );
}
