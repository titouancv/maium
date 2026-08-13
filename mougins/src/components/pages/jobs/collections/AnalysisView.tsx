"use client";

import { useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Text } from "@/components/ui";
import { TabsVertical } from "@/components/ui/TabsVertical";
import type { AnalysisListItem } from "@/types/job";
import { AnalysisOverview } from "./AnalysisOverview";
import { PrepPointList } from "./PrepPointList";
import { RecruiterQuestionList } from "./RecruiterQuestionList";

interface AnalysisViewProps {
  analysis: AnalysisListItem;
  statusBar?: ReactNode;
  tracking?: ReactNode;
  contacts?: ReactNode;
}

type AnalysisPanelKey = "overview" | "prep" | "contacts" | "tracking";

interface AnalysisPanel {
  key: AnalysisPanelKey;
  aiGenerated: boolean;
  content: ReactNode;
}

export function AnalysisView({
  analysis,
  statusBar,
  tracking,
  contacts,
}: AnalysisViewProps) {
  const t = useTranslations("jobs");
  const [activeTab, setActiveTab] = useState(0);
  const panelsRef = useRef<HTMLDivElement>(null);

  const handleTabChange = (index: number) => {
    setActiveTab(index);
    panelsRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  };

  const availablePanels: (AnalysisPanel | null)[] = [
    {
      key: "overview",
      aiGenerated: true,
      content: <AnalysisOverview analysis={analysis} />,
    },
    {
      key: "prep",
      aiGenerated: true,
      content: (
        <div className="flex flex-col gap-10">
          <PrepPointList points={analysis.prep_points} />
          <RecruiterQuestionList questions={analysis.recruiter_questions} />
        </div>
      ),
    },
    contacts
      ? { key: "contacts", aiGenerated: false, content: contacts }
      : null,
    tracking
      ? { key: "tracking", aiGenerated: false, content: tracking }
      : null,
  ];

  const panels = availablePanels.filter(
    (panel): panel is AnalysisPanel => panel !== null,
  );

  const activeIndex = Math.min(activeTab, panels.length - 1);

  return (
    <div className="flex w-full min-w-0 flex-col gap-8">
      <div ref={panelsRef} className="flex w-full min-w-0 scroll-mt-18 gap-12">
        <div className="hidden shrink-0 md:block">
          <div className="sticky top-18">
            <TabsVertical
              tabs={panels.map((panel) => t(`detail.tabs.${panel.key}`))}
              activeTab={activeIndex}
              onChange={handleTabChange}
              layoutId="analysisTab"
            />
          </div>
        </div>

        <div className="flex w-full min-w-0 flex-1 flex-col gap-8 md:min-h-[calc(100dvh-12rem)]">
          <div className="flex w-full justify-center md:justify-end">
            {statusBar}
          </div>
          {panels.map((panel, index) => (
            <div
              key={panel.key}
              className={cn(
                "flex w-full min-w-0 flex-col gap-10",
                index === activeIndex ? "md:flex" : "md:hidden",
              )}
            >
              {panel.content}
            </div>
          ))}

          <Text tone="muted" size="xs" className="text-center md:hidden">
            {t("detail.aiDisclaimer")}
          </Text>

          {panels[activeIndex].aiGenerated && (
            <Text
              tone="muted"
              size="xs"
              className="hidden text-center md:block"
            >
              {t("detail.aiDisclaimer")}
            </Text>
          )}
        </div>
      </div>
    </div>
  );
}
