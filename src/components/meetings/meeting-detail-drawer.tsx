"use client";

import { useState } from "react";
import {
  Drawer,
  Tag,
  Tabs,
  Button,
  Popconfirm,
  Input,
  Spin,
} from "antd";
import {
  Calendar,
  Clock,
  Users,
  ExternalLink,
  Pencil,
  XCircle,
  Bell,
} from "lucide-react";
import { IMeeting, IUser } from "@/types";
import {
  useGetMeetingQuery,
  useCancelMeetingMutation,
  useSendReminderMutation,
} from "@/store/meetings-api";
import toast from "react-hot-toast";

interface MeetingDetailDrawerProps {
  meetingId: string | null;
  onClose: () => void;
  onEdit: (meeting: IMeeting) => void;
}

const TYPE_TAG_COLORS: Record<string, string> = {
  regular: "#40916c",
  special: "#2563eb",
  emergency: "#dc2626",
};

const STATUS_TAG_COLORS: Record<string, string> = {
  scheduled: "blue",
  "in-progress": "green",
  completed: "default",
  cancelled: "red",
};

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString([], {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hrs} hr${hrs > 1 ? "s" : ""}`;
  return `${hrs} hr ${mins} min`;
}

export function MeetingDetailDrawer({
  meetingId,
  onClose,
  onEdit,
}: MeetingDetailDrawerProps) {
  const [cancelReason, setCancelReason] = useState("");

  const { data, isLoading } = useGetMeetingQuery(meetingId!, {
    skip: !meetingId,
  });
  const meeting = data?.data;

  const [cancelMeeting, { isLoading: isCancelling }] =
    useCancelMeetingMutation();
  const [sendReminder, { isLoading: isSending }] = useSendReminderMutation();

  const handleCancel = async () => {
    if (!meeting) return;
    try {
      await cancelMeeting({
        id: meeting._id,
        reason: cancelReason || undefined,
      }).unwrap();
      toast.success("Meeting cancelled");
      setCancelReason("");
    } catch {
      toast.error("Failed to cancel meeting");
    }
  };

  const handleReminder = async () => {
    if (!meeting) return;
    try {
      await sendReminder(meeting._id).unwrap();
      toast.success("Reminder sent to invitees");
    } catch {
      toast.error("Failed to send reminder");
    }
  };

  const inviteeCount = meeting?.invitees?.length ?? 0;
  const typeColor =
    meeting?.status === "cancelled"
      ? "#9ca3af"
      : TYPE_TAG_COLORS[meeting?.type ?? "regular"];
  const statusColor = STATUS_TAG_COLORS[meeting?.status ?? "scheduled"];

  const isCancelled = meeting?.status === "cancelled";
  const isCompleted = meeting?.status === "completed";

  const tabItems = [
    {
      key: "agenda",
      label: "Agenda",
      children: (
        <div className="space-y-2">
          {meeting?.agenda && meeting.agenda.length > 0 ? (
            <ol className="list-decimal list-inside space-y-1.5">
              {meeting.agenda.map((item, idx) => (
                <li
                  key={idx}
                  className="text-sm text-foreground/80 leading-relaxed"
                >
                  {item}
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-muted-foreground">
              No agenda items added yet.
            </p>
          )}
        </div>
      ),
    },
    {
      key: "minutes",
      label: "Minutes",
      children: (
        <div className="py-8 text-center text-sm text-muted-foreground">
          Minutes Tab
        </div>
      ),
    },
    {
      key: "attendance",
      label: "Attendance",
      children: (
        <div className="py-8 text-center text-sm text-muted-foreground">
          Attendance Tab
        </div>
      ),
    },
    {
      key: "action-items",
      label: "Action Items",
      children: (
        <div className="py-8 text-center text-sm text-muted-foreground">
          Action Items Tab
        </div>
      ),
    },
  ];

  return (
    <Drawer
      open={!!meetingId}
      onClose={onClose}
      width={640}
      title={null}
      styles={{ body: { padding: 0 } }}
    >
      {isLoading || !meeting ? (
        <div className="flex items-center justify-center h-64">
          <Spin size="large" />
        </div>
      ) : (
        <div className="flex flex-col h-full">
          {/* Header Section */}
          <div className="p-6 border-b border-white/20">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h2 className="text-xl font-bold leading-tight">
                {meeting.title}
              </h2>
              <div className="flex items-center gap-1.5 shrink-0">
                <Tag color={typeColor} className="m-0">
                  {meeting.type}
                </Tag>
                <Tag color={statusColor} className="m-0">
                  {meeting.status}
                </Tag>
              </div>
            </div>

            {/* Date, Time, Duration */}
            <div className="space-y-1.5 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{formatDateTime(meeting.date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{formatDuration(meeting.duration)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>
                  {inviteeCount} member{inviteeCount !== 1 ? "s" : ""} invited
                </span>
              </div>
            </div>

            {/* Meet Link */}
            {meeting.meetLink && (
              <div className="mt-3">
                <Button
                  type="primary"
                  icon={<ExternalLink className="h-4 w-4" />}
                  style={{ backgroundColor: "#40916c", borderColor: "#40916c" }}
                  href={meeting.meetLink}
                  target="_blank"
                >
                  Join Meeting
                </Button>
              </div>
            )}

            {/* Description */}
            {meeting.description && (
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                {meeting.description}
              </p>
            )}

            {/* Cancelled reason */}
            {isCancelled && meeting.cancelledReason && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                <span className="text-xs font-medium text-red-600">
                  Cancellation reason:
                </span>
                <p className="text-sm text-red-700 mt-0.5">
                  {meeting.cancelledReason}
                </p>
              </div>
            )}

            {/* Invitees list */}
            {meeting.invitees && meeting.invitees.length > 0 && (
              <div className="mt-3">
                <div className="flex flex-wrap gap-1.5">
                  {meeting.invitees.map((inv, idx) => {
                    const name =
                      typeof inv === "object"
                        ? (inv as IUser).fullName
                        : inv;
                    return (
                      <Tag key={idx} className="m-0 text-xs">
                        {name}
                      </Tag>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex-1 overflow-y-auto px-6 pt-2">
            <Tabs items={tabItems} defaultActiveKey="agenda" />
          </div>

          {/* Actions Footer */}
          {!isCancelled && !isCompleted && (
            <div className="p-4 border-t border-white/20 flex items-center gap-2">
              <Button
                icon={<Pencil className="h-4 w-4" />}
                onClick={() => onEdit(meeting)}
              >
                Edit
              </Button>

              <Popconfirm
                title="Cancel this meeting?"
                description={
                  <div className="mt-2">
                    <Input.TextArea
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="Reason for cancellation (optional)"
                      rows={2}
                      className="mt-1"
                    />
                  </div>
                }
                onConfirm={handleCancel}
                okText="Cancel Meeting"
                cancelText="Keep"
                okButtonProps={{ danger: true, loading: isCancelling }}
              >
                <Button
                  danger
                  icon={<XCircle className="h-4 w-4" />}
                >
                  Cancel
                </Button>
              </Popconfirm>

              <Button
                icon={<Bell className="h-4 w-4" />}
                onClick={handleReminder}
                loading={isSending}
              >
                Send Reminder
              </Button>
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
}
