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
    <div className="flex overflow-x-auto hide-scrollbar gap-2">
      {tabs.map((tab, idx) => (
        <button
          key={idx}
          onClick={() => onChange(idx)}
          className={`relative py-1 px-4 font-bold whitespace-nowrap`}
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
