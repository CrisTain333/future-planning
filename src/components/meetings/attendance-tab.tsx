"use client";

import { useState, useMemo, useCallback } from "react";
import { Table, Select, Tag, Button } from "antd";
import type { ColumnsType } from "antd/es/table";
import { IMeeting, IAttendanceRecord, IUser } from "@/types";
import { useUpdateAttendanceMutation } from "@/store/meetings-api";
import toast from "react-hot-toast";
import dayjs from "dayjs";

interface AttendanceTabProps {
  meeting: IMeeting;
  readOnly?: boolean;
}

const STATUS_OPTIONS = [
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "excused", label: "Excused" },
  { value: "not_marked", label: "Not Marked" },
];

const STATUS_COLORS: Record<string, string> = {
  present: "#40916c",
  absent: "#dc2626",
  excused: "#d97706",
  not_marked: "#9ca3af",
};

type AttendanceStatus = IAttendanceRecord["status"];

export function AttendanceTab({ meeting, readOnly }: AttendanceTabProps) {
  const [localAttendance, setLocalAttendance] = useState<IAttendanceRecord[]>(
    () => meeting.attendance ?? []
  );
  const [updateAttendance, { isLoading }] = useUpdateAttendanceMutation();

  const counts = useMemo(() => {
    const c = { present: 0, absent: 0, excused: 0, not_marked: 0 };
    for (const rec of localAttendance) {
      if (rec.status in c) {
        c[rec.status as keyof typeof c]++;
      }
    }
    return c;
  }, [localAttendance]);

  const persistAttendance = useCallback(
    async (records: IAttendanceRecord[]) => {
      try {
        const body = {
          attendance: records.map((rec) => ({
            userId:
              typeof rec.user === "object" ? (rec.user as IUser)._id : rec.user,
            status: rec.status,
          })),
        };
        await updateAttendance({ id: meeting._id, body }).unwrap();
        toast.success("Attendance updated");
      } catch {
        toast.error("Failed to update attendance");
      }
    },
    [meeting._id, updateAttendance]
  );

  const handleStatusChange = useCallback(
    (index: number, newStatus: AttendanceStatus) => {
      setLocalAttendance((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], status: newStatus };
        persistAttendance(updated);
        return updated;
      });
    },
    [persistAttendance]
  );

  const handleBulkUpdate = useCallback(
    (status: AttendanceStatus) => {
      setLocalAttendance((prev) => {
        const updated = prev.map((rec) => ({ ...rec, status }));
        persistAttendance(updated);
        return updated;
      });
    },
    [persistAttendance]
  );

  const columns: ColumnsType<IAttendanceRecord> = [
    {
      title: "Member Name",
      key: "name",
      render: (_: unknown, record: IAttendanceRecord) => {
        const user = record.user as IUser;
        return <span className="font-medium">{user?.fullName ?? "-"}</span>;
      },
    },
    {
      title: "Status",
      key: "status",
      width: 160,
      render: (_: unknown, record: IAttendanceRecord, index: number) => (
        <Select
          value={record.status}
          onChange={(val) => handleStatusChange(index, val)}
          options={STATUS_OPTIONS}
          size="small"
          className="w-full"
          disabled={readOnly || isLoading}
        />
      ),
    },
    {
      title: "Check-in Time",
      key: "checkInTime",
      width: 150,
      render: (_: unknown, record: IAttendanceRecord) =>
        record.checkInTime
          ? dayjs(record.checkInTime).format("hh:mm A")
          : "-",
    },
    {
      title: "Marked By",
      key: "markedBy",
      width: 100,
      render: (_: unknown, record: IAttendanceRecord) =>
        record.markedBy === "self" ? (
          <Tag color="green">Self</Tag>
        ) : (
          <Tag color="blue">Admin</Tag>
        ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Summary Bar */}
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span>
          <span className="font-semibold" style={{ color: STATUS_COLORS.present }}>
            {counts.present}
          </span>{" "}
          present
        </span>
        <span className="text-muted-foreground">/</span>
        <span>
          <span className="font-semibold" style={{ color: STATUS_COLORS.absent }}>
            {counts.absent}
          </span>{" "}
          absent
        </span>
        <span className="text-muted-foreground">/</span>
        <span>
          <span className="font-semibold" style={{ color: STATUS_COLORS.excused }}>
            {counts.excused}
          </span>{" "}
          excused
        </span>
        <span className="text-muted-foreground">/</span>
        <span>
          <span
            className="font-semibold"
            style={{ color: STATUS_COLORS.not_marked }}
          >
            {counts.not_marked}
          </span>{" "}
          not marked
        </span>
      </div>

      {/* Bulk Actions */}
      {!readOnly && (
        <div className="flex gap-2">
          <Button
            size="small"
            onClick={() => handleBulkUpdate("present")}
            loading={isLoading}
          >
            Mark All Present
          </Button>
          <Button
            size="small"
            onClick={() => handleBulkUpdate("absent")}
            loading={isLoading}
          >
            Mark All Absent
          </Button>
        </div>
      )}

      {/* Table */}
      <Table
        columns={columns}
        dataSource={localAttendance}
        rowKey={(record) => {
          const user = record.user as IUser;
          return user?._id ?? String(record.user);
        }}
        rowClassName={(record) =>
          record.markedBy === "self" ? "bg-green-50/40" : ""
        }
        pagination={false}
        size="small"
        loading={isLoading}
      />
    </div>
  );
}
