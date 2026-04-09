"use client";

import { useState, useMemo } from "react";
import { CalendarHeader, CalendarView } from "@/components/meetings/calendar-header";
import { CalendarMonthView } from "@/components/meetings/calendar-month-view";
import { CalendarWeekView } from "@/components/meetings/calendar-week-view";
import { CalendarDayView } from "@/components/meetings/calendar-day-view";
import { CalendarAgendaView } from "@/components/meetings/calendar-agenda-view";
import { MeetingFormModal } from "@/components/meetings/meeting-form-modal";
import { MeetingDetailDrawer } from "@/components/meetings/meeting-detail-drawer";
import { useGetMeetingsQuery } from "@/store/meetings-api";
import { IMeeting } from "@/types";

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekEnd(date: Date): Date {
  const d = getWeekStart(date);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

export default function AdminMeetingsPage() {
  const [view, setView] = useState<CalendarView>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<IMeeting | undefined>();
  const [detailId, setDetailId] = useState<string | null>(null);

  // Calculate date range based on view
  const { startDate, endDate } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    switch (view) {
      case "month": {
        const start = new Date(year, month, 1);
        const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
        return { startDate: start.toISOString(), endDate: end.toISOString() };
      }
      case "week": {
        const start = getWeekStart(currentDate);
        const end = getWeekEnd(currentDate);
        return { startDate: start.toISOString(), endDate: end.toISOString() };
      }
      case "day": {
        const start = new Date(year, month, currentDate.getDate(), 0, 0, 0, 0);
        const end = new Date(year, month, currentDate.getDate(), 23, 59, 59, 999);
        return { startDate: start.toISOString(), endDate: end.toISOString() };
      }
      case "agenda": {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setDate(end.getDate() + 60);
        end.setHours(23, 59, 59, 999);
        return { startDate: start.toISOString(), endDate: end.toISOString() };
      }
      default:
        return { startDate: undefined, endDate: undefined };
    }
  }, [view, currentDate]);

  const { data, isLoading } = useGetMeetingsQuery({
    startDate,
    endDate,
    limit: 200,
  });
  const meetings = data?.data ?? [];

  // Navigation handlers
  const handlePrev = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      switch (view) {
        case "month":
          d.setMonth(d.getMonth() - 1);
          break;
        case "week":
          d.setDate(d.getDate() - 7);
          break;
        case "day":
          d.setDate(d.getDate() - 1);
          break;
        case "agenda":
          break;
      }
      return d;
    });
  };

  const handleNext = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      switch (view) {
        case "month":
          d.setMonth(d.getMonth() + 1);
          break;
        case "week":
          d.setDate(d.getDate() + 7);
          break;
        case "day":
          d.setDate(d.getDate() + 1);
          break;
        case "agenda":
          break;
      }
      return d;
    });
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Title generation based on view
  const title = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    switch (view) {
      case "month":
        return currentDate.toLocaleDateString([], { month: "long", year: "numeric" });
      case "week": {
        const start = getWeekStart(currentDate);
        const end = getWeekEnd(currentDate);
        const startStr = start.toLocaleDateString([], { month: "short", day: "numeric" });
        const endStr = end.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
        return `${startStr} - ${endStr}`;
      }
      case "day":
        return currentDate.toLocaleDateString([], {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        });
      case "agenda":
        return "Upcoming Meetings";
      default:
        return "";
    }
  }, [view, currentDate]);

  const handleNewMeeting = () => {
    setEditingMeeting(undefined);
    setModalOpen(true);
  };

  const handleMeetingClick = (id: string) => {
    setDetailId(id);
  };

  const handleDayClick = (date: Date) => {
    setCurrentDate(date);
    setView("day");
  };

  const handleEdit = (meeting: IMeeting) => {
    setDetailId(null);
    setEditingMeeting(meeting);
    setModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <CalendarHeader
        view={view}
        onViewChange={setView}
        currentDate={currentDate}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
        onNewMeeting={handleNewMeeting}
        title={title}
      />

      <div className="glass-card rounded-xl overflow-hidden">
        {view === "month" && (
          <CalendarMonthView
            meetings={meetings}
            currentDate={currentDate}
            onMeetingClick={handleMeetingClick}
            onDayClick={handleDayClick}
          />
        )}
        {view === "week" && (
          <CalendarWeekView
            meetings={meetings}
            currentDate={currentDate}
            onMeetingClick={handleMeetingClick}
            onDayClick={handleDayClick}
          />
        )}
        {view === "day" && (
          <CalendarDayView
            meetings={meetings}
            currentDate={currentDate}
            onMeetingClick={handleMeetingClick}
          />
        )}
        {view === "agenda" && (
          <CalendarAgendaView
            meetings={meetings}
            isLoading={isLoading}
            onMeetingClick={handleMeetingClick}
          />
        )}
      </div>

      <MeetingFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        meeting={editingMeeting}
      />

      <MeetingDetailDrawer
        meetingId={detailId}
        onClose={() => setDetailId(null)}
        onEdit={handleEdit}
      />
    </div>
  );
}
