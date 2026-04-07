"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Landmark } from "lucide-react";
import { OverviewTab } from "@/components/investments/overview-tab";
import { FDTab } from "@/components/investments/fd-tab";
import { AnalyticsTab } from "@/components/investments/analytics-tab";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "deposits", label: "Fixed Deposits" },
  { key: "analytics", label: "Analytics" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function InvestmentsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Landmark className="h-6 w-6 text-primary" />
          Investments
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track and manage your fixed deposit investments
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "deposits" && <FDTab />}
        {activeTab === "analytics" && <AnalyticsTab />}
      </motion.div>
    </div>
  );
}
