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

const TYPE_COLORS: Record<string, string> = {
  regular: "bg-[#40916c] border-[#40916c]/60",
  special: "bg-[#2563eb] border-[#2563eb]/60",
  emergency: "bg-[#dc2626] border-[#dc2626]/60",
  cancelled: "bg-[#9ca3af] border-[#9ca3af]/60",
};

const START_HOUR = 6;
const END_HOUR = 22;
const HOUR_HEIGHT = 60; // px per hour

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

  // Current time line position
  const showTimeLine = weekDays.some((d) => isSameDay(d, today));
  const timeLineTop =
    (currentTime.getHours() - START_HOUR + currentTime.getMinutes() / 60) *
    HOUR_HEIGHT;
  const timeLineDayIndex = weekDays.findIndex((d) => isSameDay(d, today));

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-[64px_repeat(7,1fr)] border-b border-white/20">
        <div />
        {weekDays.map((d, i) => {
          const isToday = isSameDay(d, today);
          return (
            <div
              key={i}
              className={cn(
                "py-2 text-center border-l border-white/10",
                isToday && "bg-primary/10"
              )}
            >
              <div className="text-xs text-muted-foreground">
                {d.toLocaleDateString([], { weekday: "short" })}
              </div>
              <div
                className={cn(
                  "text-sm font-medium mx-auto w-7 h-7 flex items-center justify-center rounded-full",
                  isToday && "bg-primary text-primary-foreground"
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
        <div
          className="grid grid-cols-[64px_repeat(7,1fr)] relative"
          style={{ height: totalHeight }}
        >
          {/* Hour labels */}
          <div className="relative">
            {Array.from({ length: END_HOUR - START_HOUR }, (_, i) => (
              <div
                key={i}
                className="absolute right-2 text-[10px] text-muted-foreground -translate-y-1/2"
                style={{ top: i * HOUR_HEIGHT }}
              >
                {formatHour(START_HOUR + i)}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((d, dayIdx) => {
            const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
            const dayMeetings = meetingsByDay[key] ?? [];

            return (
              <div
                key={dayIdx}
                className="relative border-l border-white/10"
              >
                {/* Hour grid lines */}
                {Array.from(
                  { length: END_HOUR - START_HOUR },
                  (_, i) => (
                    <div
                      key={i}
                      className="absolute w-full border-t border-white/5"
                      style={{ top: i * HOUR_HEIGHT }}
                    />
                  )
                )}

                {/* Meeting blocks */}
                {dayMeetings.map((m) => {
                  const start = new Date(m.date);
                  const startMinutes =
                    (start.getHours() - START_HOUR) * 60 +
                    start.getMinutes();
                  const top = (startMinutes / 60) * HOUR_HEIGHT;
                  const height = (m.duration / 60) * HOUR_HEIGHT;

                  if (top < 0 || top > totalHeight) return null;

                  const colorClass =
                    m.status === "cancelled"
                      ? TYPE_COLORS.cancelled
                      : TYPE_COLORS[m.type] ?? TYPE_COLORS.regular;

                  return (
                    <button
                      key={m._id}
                      className={cn(
                        "absolute left-0.5 right-0.5 rounded px-1.5 py-0.5 text-[10px] text-white overflow-hidden border-l-2 cursor-pointer",
                        colorClass
                      )}
                      style={{
                        top: Math.max(0, top),
                        height: Math.max(20, height),
                      }}
                      onClick={() => onMeetingClick(m._id)}
                    >
                      <div className="font-medium truncate">{m.title}</div>
                      <div className="opacity-80">
                        {start.toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}

          {/* Current time indicator */}
          {showTimeLine &&
            timeLineTop >= 0 &&
            timeLineTop <= totalHeight && (
              <div
                className="absolute left-[64px] right-0 z-10 pointer-events-none flex items-center"
                style={{ top: timeLineTop }}
              >
                {/* Red dot on the current day column */}
                <div
                  className="absolute w-2 h-2 rounded-full bg-red-500 -translate-y-1/2"
                  style={{
                    left: `calc(${(timeLineDayIndex / 7) * 100}%)`,
                  }}
                />
                <div className="w-full h-px bg-red-500" />
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
