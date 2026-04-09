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
}

export function CalendarHeader({
  view,
  onViewChange,
  onPrev,
  onNext,
  onToday,
  onNewMeeting,
  title,
}: CalendarHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Left: Page title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Video className="h-6 w-6 text-primary" />
          Meetings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Schedule and manage foundation meetings
        </p>
      </div>

      {/* Right: Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Navigation */}
        <div className="flex items-center gap-2">
          <Button
            size="small"
            icon={<ChevronLeft className="h-4 w-4" />}
            onClick={onPrev}
          />
          <Button size="small" onClick={onToday}>
            Today
          </Button>
          <Button
            size="small"
            icon={<ChevronRight className="h-4 w-4" />}
            onClick={onNext}
          />
          <span className="text-sm font-medium whitespace-nowrap ml-1">
            {title}
          </span>
        </div>

        {/* View Toggle */}
        <Segmented
          size="small"
          value={view}
          onChange={(val) => onViewChange(val as CalendarView)}
          options={[
            { label: "Month", value: "month" },
            { label: "Week", value: "week" },
            { label: "Day", value: "day" },
            { label: "Agenda", value: "agenda" },
          ]}
        />

        {/* New Meeting */}
        <Button
          type="primary"
          className="glow-primary gap-2"
          icon={<Plus className="h-4 w-4" />}
          onClick={onNewMeeting}
        >
          New Meeting
        </Button>
      </div>
    </div>
  );
}
