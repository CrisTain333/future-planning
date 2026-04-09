"use client";

import { Button, Segmented } from "antd";
import { ChevronLeft, ChevronRight, Plus, Video } from "lucide-react";

export type CalendarView = "month" | "week" | "day" | "agenda";

interface CalendarHeaderProps {
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  currentDate: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onNewMeeting: () => void;
  title: string;
  readOnly?: boolean;
}

export function CalendarHeader({
  view,
  onViewChange,
  onPrev,
  onNext,
  onToday,
  onNewMeeting,
  title,
  readOnly,
}: CalendarHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Page Title Row */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Video className="h-6 w-6 text-primary" />
            Meetings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Schedule and manage foundation meetings
          </p>
        </div>
        {!readOnly && (
          <Button
            type="primary"
            className="glow-primary gap-2"
            icon={<Plus className="h-4 w-4" />}
            onClick={onNewMeeting}
          >
            New Meeting
          </Button>
        )}
      </div>

      {/* Calendar Controls Bar */}
      <div className="glass-card rounded-xl px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: Navigation + Title */}
        <div className="flex items-center gap-1">
          <div className="flex items-center rounded-lg border border-border overflow-hidden">
            <button
              onClick={onPrev}
              className="px-2.5 py-1.5 hover:bg-accent/50 transition-colors border-r border-border"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={onToday}
              className="px-3 py-1.5 text-sm font-medium hover:bg-accent/50 transition-colors border-r border-border"
            >
              Today
            </button>
            <button
              onClick={onNext}
              className="px-2.5 py-1.5 hover:bg-accent/50 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <h2 className="text-base font-semibold ml-3 whitespace-nowrap">
            {title}
          </h2>
        </div>

        {/* Right: View Toggle */}
        <Segmented
          value={view}
          onChange={(val) => onViewChange(val as CalendarView)}
          options={[
            { label: "Month", value: "month" },
            { label: "Week", value: "week" },
            { label: "Day", value: "day" },
            { label: "Agenda", value: "agenda" },
          ]}
        />
      </div>
    </div>
  );
}
