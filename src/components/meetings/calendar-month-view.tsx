"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { IMeeting } from "@/types";

interface CalendarMonthViewProps {
  meetings: IMeeting[];
  currentDate: Date;
  onMeetingClick: (id: string) => void;
  onDayClick: (date: Date) => void;
}

const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const TYPE_COLORS: Record<string, string> = {
  regular: "bg-[#40916c]",
  special: "bg-[#2563eb]",
  emergency: "bg-[#dc2626]",
  cancelled: "bg-[#9ca3af]",
};

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function CalendarMonthView({
  meetings,
  currentDate,
  onMeetingClick,
  onDayClick,
}: CalendarMonthViewProps) {
  const today = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Previous month padding
    for (let i = startPad - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({ date: d, isCurrentMonth: false });
    }

    // Current month
    for (let i = 1; i <= totalDays; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }

    // Next month padding to fill the grid
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        days.push({
          date: new Date(year, month + 1, i),
          isCurrentMonth: false,
        });
      }
    }

    return days;
  }, [year, month]);

  // Group meetings by date string for O(1) lookup
  const meetingsByDate = useMemo(() => {
    const map: Record<string, IMeeting[]> = {};
    for (const m of meetings) {
      const d = new Date(m.date);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(m);
    }
    return map;
  }, [meetings]);

  return (
    <div>
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {DAY_HEADERS.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-xs font-medium text-muted-foreground border-r border-border last:border-r-0"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {calendarDays.map(({ date, isCurrentMonth }, idx) => {
          const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
          const dayMeetings = meetingsByDate[key] ?? [];
          const isToday = isSameDay(date, today);
          const isLastCol = (idx + 1) % 7 === 0;
          const isLastRow = idx >= calendarDays.length - 7;

          return (
            <div
              key={idx}
              className={cn(
                "h-[110px] border-b border-r border-border p-1.5 cursor-pointer transition-colors hover:bg-accent/30",
                !isCurrentMonth && "bg-muted/30 text-muted-foreground",
                isLastCol && "border-r-0",
                isLastRow && "border-b-0"
              )}
              onClick={() => onDayClick(date)}
            >
              {/* Date number */}
              <div className="flex justify-end mb-1">
                <span
                  className={cn(
                    "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full",
                    isToday && "bg-primary text-primary-foreground"
                  )}
                >
                  {date.getDate()}
                </span>
              </div>

              {/* Meeting chips */}
              <div className="space-y-0.5">
                {dayMeetings.slice(0, 3).map((m) => {
                  const colorClass =
                    m.status === "cancelled"
                      ? TYPE_COLORS.cancelled
                      : TYPE_COLORS[m.type] ?? TYPE_COLORS.regular;

                  return (
                    <button
                      key={m._id}
                      className={cn(
                        "w-full text-left text-[10px] text-white rounded px-1 py-0.5 truncate block",
                        colorClass
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        onMeetingClick(m._id);
                      }}
                    >
                      {formatTime(m.date)} {m.title}
                    </button>
                  );
                })}
                {dayMeetings.length > 3 && (
                  <span className="text-[10px] text-muted-foreground">
                    +{dayMeetings.length - 3} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
