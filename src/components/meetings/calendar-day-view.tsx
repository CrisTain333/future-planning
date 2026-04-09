"use client";

import { useMemo, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Tag } from "antd";
import { Users, ExternalLink } from "lucide-react";
import { IMeeting } from "@/types";

interface CalendarDayViewProps {
  meetings: IMeeting[];
  currentDate: Date;
  onMeetingClick: (id: string) => void;
}

const TYPE_TAG_COLORS: Record<string, string> = {
  regular: "#40916c",
  special: "#2563eb",
  emergency: "#dc2626",
};

const TYPE_BG_COLORS: Record<string, string> = {
  regular: "bg-[#40916c]/10 border-[#40916c]/30",
  special: "bg-[#2563eb]/10 border-[#2563eb]/30",
  emergency: "bg-[#dc2626]/10 border-[#dc2626]/30",
  cancelled: "bg-[#9ca3af]/10 border-[#9ca3af]/30",
};

const START_HOUR = 6;
const END_HOUR = 22;
const HOUR_HEIGHT = 72; // px per hour

function formatHour(h: number): string {
  const period = h >= 12 ? "PM" : "AM";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr} ${period}`;
}

function formatTimeRange(dateStr: string, duration: number): string {
  const start = new Date(dateStr);
  const end = new Date(start.getTime() + duration * 60000);
  const fmt = (d: Date) =>
    d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return `${fmt(start)} - ${fmt(end)}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function CalendarDayView({
  meetings,
  currentDate,
  onMeetingClick,
}: CalendarDayViewProps) {
  const today = new Date();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const dayMeetings = useMemo(() => {
    return meetings.filter((m) => {
      const d = new Date(m.date);
      return isSameDay(d, currentDate);
    });
  }, [meetings, currentDate]);

  const totalHeight = (END_HOUR - START_HOUR) * HOUR_HEIGHT;
  const isToday = isSameDay(currentDate, today);
  const timeLineTop =
    (currentTime.getHours() - START_HOUR + currentTime.getMinutes() / 60) *
    HOUR_HEIGHT;

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      {/* Day header */}
      <div className="p-3 border-b border-white/20 text-center">
        <div className="text-sm text-muted-foreground">
          {currentDate.toLocaleDateString([], { weekday: "long" })}
        </div>
        <div
          className={cn(
            "text-lg font-semibold mx-auto w-9 h-9 flex items-center justify-center rounded-full",
            isToday && "bg-primary text-primary-foreground"
          )}
        >
          {currentDate.getDate()}
        </div>
      </div>

      {/* Time grid */}
      <div className="overflow-y-auto max-h-[600px]">
        <div
          className="grid grid-cols-[64px_1fr] relative"
          style={{ height: totalHeight }}
        >
          {/* Hour labels */}
          <div className="relative">
            {Array.from({ length: END_HOUR - START_HOUR }, (_, i) => (
              <div
                key={i}
                className="absolute right-3 text-xs text-muted-foreground -translate-y-1/2"
                style={{ top: i * HOUR_HEIGHT }}
              >
                {formatHour(START_HOUR + i)}
              </div>
            ))}
          </div>

          {/* Main column */}
          <div className="relative border-l border-white/10">
            {/* Hour grid lines */}
            {Array.from({ length: END_HOUR - START_HOUR }, (_, i) => (
              <div
                key={i}
                className="absolute w-full border-t border-white/5"
                style={{ top: i * HOUR_HEIGHT }}
              />
            ))}

            {/* Meeting cards */}
            {dayMeetings.map((m) => {
              const start = new Date(m.date);
              const startMinutes =
                (start.getHours() - START_HOUR) * 60 + start.getMinutes();
              const top = (startMinutes / 60) * HOUR_HEIGHT;
              const height = (m.duration / 60) * HOUR_HEIGHT;
              const inviteeCount = m.invitees?.length ?? 0;

              const bgClass =
                m.status === "cancelled"
                  ? TYPE_BG_COLORS.cancelled
                  : TYPE_BG_COLORS[m.type] ?? TYPE_BG_COLORS.regular;

              const tagColor =
                m.status === "cancelled"
                  ? "#9ca3af"
                  : TYPE_TAG_COLORS[m.type] ?? TYPE_TAG_COLORS.regular;

              return (
                <button
                  key={m._id}
                  className={cn(
                    "absolute left-1 right-1 rounded-lg border p-2.5 cursor-pointer text-left",
                    bgClass
                  )}
                  style={{
                    top: Math.max(0, top),
                    minHeight: Math.max(44, height),
                  }}
                  onClick={() => onMeetingClick(m._id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm truncate">
                        {m.title}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {formatTimeRange(m.date, m.duration)}
                      </div>
                    </div>
                    <Tag
                      color={tagColor}
                      className="text-[10px] leading-tight m-0"
                    >
                      {m.type}
                    </Tag>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {inviteeCount}
                    </span>
                    {m.meetLink && (
                      <a
                        href={m.meetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-3 w-3" />
                        Meet
                      </a>
                    )}
                  </div>
                </button>
              );
            })}

            {/* Current time indicator */}
            {isToday && timeLineTop >= 0 && timeLineTop <= totalHeight && (
              <div
                className="absolute left-0 right-0 z-10 pointer-events-none flex items-center"
                style={{ top: timeLineTop }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 -translate-x-1/2" />
                <div className="flex-1 h-px bg-red-500" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
