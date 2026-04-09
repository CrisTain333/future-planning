"use client";

import { useMemo, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { IMeeting } from "@/types";

interface CalendarWeekViewProps {
  meetings: IMeeting[];
  currentDate: Date;
  onMeetingClick: (id: string) => void;
  onDayClick: (date: Date) => void;
}

const TYPE_BG: Record<string, string> = {
  regular: "bg-[#40916c]",
  special: "bg-[#2563eb]",
  emergency: "bg-[#dc2626]",
  cancelled: "bg-[#9ca3af]",
};

const TYPE_BORDER: Record<string, string> = {
  regular: "border-l-[#2d6a4f]",
  special: "border-l-[#1d4ed8]",
  emergency: "border-l-[#b91c1c]",
  cancelled: "border-l-[#6b7280]",
};

const START_HOUR = 6;
const END_HOUR = 22;
const HOUR_HEIGHT = 64;

function getWeekDays(date: Date): Date[] {
  const d = new Date(date);
  const day = d.getDay();
  const start = new Date(d);
  start.setDate(d.getDate() - day);
  start.setHours(0, 0, 0, 0);
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const dd = new Date(start);
    dd.setDate(start.getDate() + i);
    days.push(dd);
  }
  return days;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatHour(h: number): string {
  const period = h >= 12 ? "PM" : "AM";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr} ${period}`;
}

export function CalendarWeekView({
  meetings,
  currentDate,
  onMeetingClick,
}: CalendarWeekViewProps) {
  const today = new Date();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);

  const meetingsByDay = useMemo(() => {
    const map: Record<string, IMeeting[]> = {};
    for (const m of meetings) {
      const d = new Date(m.date);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(m);
    }
    return map;
  }, [meetings]);

  const totalHeight = (END_HOUR - START_HOUR) * HOUR_HEIGHT;
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

  // Current time indicator
  const showTimeLine = weekDays.some((d) => isSameDay(d, today));
  const timeLineTop =
    (currentTime.getHours() - START_HOUR + currentTime.getMinutes() / 60) *
    HOUR_HEIGHT;
  const timeLineDayIndex = weekDays.findIndex((d) => isSameDay(d, today));

  return (
    <div>
      {/* Day headers */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border">
        <div className="border-r border-border" />
        {weekDays.map((d, i) => {
          const isToday = isSameDay(d, today);
          return (
            <div
              key={i}
              className={cn(
                "py-3 text-center border-r border-border last:border-r-0",
                isToday && "bg-primary/5"
              )}
            >
              <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                {d.toLocaleDateString([], { weekday: "short" })}
              </div>
              <div
                className={cn(
                  "text-lg font-semibold mx-auto w-9 h-9 flex items-center justify-center rounded-full mt-0.5",
                  isToday
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground"
                )}
              >
                {d.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div className="overflow-y-auto max-h-[600px]">
        <div className="relative" style={{ height: totalHeight }}>
          {/* Hour rows with labels */}
          {hours.map((hour, i) => (
            <div
              key={hour}
              className="absolute left-0 right-0 flex"
              style={{ top: i * HOUR_HEIGHT }}
            >
              {/* Hour label */}
              <div className="w-[60px] flex-shrink-0 border-r border-border relative">
                <span className="absolute -top-[9px] right-2 text-[11px] text-muted-foreground font-medium">
                  {i > 0 ? formatHour(hour) : ""}
                </span>
              </div>
              {/* Grid line across all columns */}
              <div className="flex-1 border-t border-border" />
            </div>
          ))}

          {/* Day columns (for vertical borders + meeting blocks) */}
          <div
            className="absolute top-0 left-[60px] right-0 grid grid-cols-7"
            style={{ height: totalHeight }}
          >
            {weekDays.map((d, dayIdx) => {
              const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
              const dayMeetings = meetingsByDay[key] ?? [];
              const isToday = isSameDay(d, today);

              return (
                <div
                  key={dayIdx}
                  className={cn(
                    "relative border-r border-border last:border-r-0",
                    isToday && "bg-primary/[0.02]"
                  )}
                >
                  {/* Meeting blocks */}
                  {dayMeetings.map((m) => {
                    const start = new Date(m.date);
                    const startMinutes =
                      (start.getHours() - START_HOUR) * 60 +
                      start.getMinutes();
                    const top = (startMinutes / 60) * HOUR_HEIGHT;
                    const height = (m.duration / 60) * HOUR_HEIGHT;

                    if (top < 0 || top > totalHeight) return null;

                    const bgClass =
                      m.status === "cancelled"
                        ? TYPE_BG.cancelled
                        : TYPE_BG[m.type] ?? TYPE_BG.regular;
                    const borderClass =
                      m.status === "cancelled"
                        ? TYPE_BORDER.cancelled
                        : TYPE_BORDER[m.type] ?? TYPE_BORDER.regular;

                    return (
                      <button
                        key={m._id}
                        className={cn(
                          "absolute left-1 right-1 rounded-md px-2 py-1 text-white overflow-hidden border-l-[3px] cursor-pointer shadow-sm hover:shadow-md transition-shadow",
                          bgClass,
                          borderClass
                        )}
                        style={{
                          top: Math.max(0, top),
                          height: Math.max(24, height),
                          zIndex: 5,
                        }}
                        onClick={() => onMeetingClick(m._id)}
                      >
                        <div className="text-xs font-semibold truncate leading-tight">
                          {m.title}
                        </div>
                        {height >= 40 && (
                          <div className="text-[10px] opacity-90 leading-tight mt-0.5">
                            {start.toLocaleTimeString([], {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Current time indicator — only on today's column */}
          {showTimeLine &&
            timeLineDayIndex >= 0 &&
            timeLineTop >= 0 &&
            timeLineTop <= totalHeight && (
              <div
                className="absolute z-10 pointer-events-none"
                style={{
                  top: timeLineTop,
                  left: `calc(60px + ${timeLineDayIndex} * ((100% - 60px) / 7))`,
                  width: `calc((100% - 60px) / 7)`,
                }}
              >
                <div className="relative flex items-center">
                  <div className="absolute -left-1.5 w-3 h-3 rounded-full bg-red-500 -translate-y-1/2 z-20" />
                  <div className="w-full h-[2px] bg-red-500" />
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
