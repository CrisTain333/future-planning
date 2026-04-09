"use client";

import { useEffect, useState } from "react";
import { IMeeting, IUser } from "@/types";
import {
  useCreateMeetingMutation,
  useUpdateMeetingMutation,
} from "@/store/meetings-api";
import { useGetUsersQuery } from "@/store/users-api";
import toast from "react-hot-toast";
import { Modal, Select, Input, Button, DatePicker, Radio } from "antd";
import { Plus, Trash2 } from "lucide-react";
import dayjs from "dayjs";

interface MeetingFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meeting?: IMeeting;
}

const DURATION_OPTIONS = [
  { value: 30, label: "30 minutes" },
  { value: 45, label: "45 minutes" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
];

export function MeetingFormModal({
  open,
  onOpenChange,
  meeting,
}: MeetingFormModalProps) {
  const isEdit = !!meeting;

  const { data: usersData } = useGetUsersQuery({ page: 1, limit: 100 });
  const [createMeeting, { isLoading: isCreating }] =
    useCreateMeetingMutation();
  const [updateMeeting, { isLoading: isUpdating }] =
    useUpdateMeetingMutation();

  const users = usersData?.data ?? [];

  const [title, setTitle] = useState("");
  const [type, setType] = useState<"regular" | "special" | "emergency">(
    "regular"
  );
  const [date, setDate] = useState<dayjs.Dayjs | null>(dayjs());
  const [duration, setDuration] = useState<number>(60);
  const [description, setDescription] = useState("");
  const [agenda, setAgenda] = useState<string[]>([""]);
  const [invitees, setInvitees] = useState<string[]>([]);

  // Populate form when editing or resetting
  useEffect(() => {
    if (meeting) {
      setTitle(meeting.title);
      setType(meeting.type);
      setDate(dayjs(meeting.date));
      setDuration(meeting.duration);
      setDescription(meeting.description ?? "");
      setAgenda(
        meeting.agenda && meeting.agenda.length > 0
          ? [...meeting.agenda]
          : [""]
      );
      setInvitees(
        meeting.invitees.map((inv) =>
          typeof inv === "object" ? inv._id : inv
        )
      );
    } else {
      setTitle("");
      setType("regular");
      setDate(dayjs());
      setDuration(60);
      setDescription("");
      setAgenda([""]);
      setInvitees([]);
    }
  }, [meeting, open]);

  const handleAddAgendaItem = () => {
    setAgenda((prev) => [...prev, ""]);
  };

  const handleRemoveAgendaItem = (index: number) => {
    setAgenda((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAgendaChange = (index: number, value: string) => {
    setAgenda((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Please enter a meeting title");
      return;
    }
    if (!date) {
      toast.error("Please select a date and time");
      return;
    }

    // Filter out empty agenda items
    const filteredAgenda = agenda.filter((item) => item.trim() !== "");

    try {
      const payload = {
        title: title.trim(),
        type,
        date: date.toISOString(),
        duration,
        description: description.trim() || undefined,
        agenda: filteredAgenda.length > 0 ? filteredAgenda : undefined,
        invitees,
      };

      if (isEdit && meeting) {
        await updateMeeting({
          id: meeting._id,
          body: payload,
        }).unwrap();
        toast.success("Meeting updated successfully");
      } else {
        await createMeeting(payload).unwrap();
        toast.success("Meeting created successfully");
      }
      onOpenChange(false);
    } catch (err: unknown) {
      const message = (err as { data?: { error?: string } })?.data?.error;
      toast.error(
        message ||
          (isEdit ? "Failed to update meeting" : "Failed to create meeting")
      );
    }
  };

  const isSubmitting = isCreating || isUpdating;

  return (
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      title={
        <div>
          <h2 className="text-lg font-semibold">
            {isEdit ? "Edit Meeting" : "New Meeting"}
          </h2>
          <p className="text-sm font-normal text-muted-foreground mt-1">
            {isEdit
              ? "Update the meeting details below."
              : "Fill in the details to schedule a new meeting."}
          </p>
        </div>
      }
      footer={null}
      destroyOnClose
      width={560}
    >
      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Meeting title"
            required
          />
        </div>

        {/* Type */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Type</label>
          <div>
            <Radio.Group
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <Radio value="regular">Regular</Radio>
              <Radio value="special">Special</Radio>
              <Radio value="emergency">Emergency</Radio>
            </Radio.Group>
          </div>
        </div>

        {/* Date & Duration */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Date & Time</label>
            <DatePicker
              className="w-full"
              showTime={{ format: "hh:mm A", use12Hours: true }}
              value={date}
              onChange={(d) => setDate(d)}
              format="DD MMM YYYY hh:mm A"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Duration</label>
            <Select
              className="w-full"
              value={duration}
              onChange={(val) => setDuration(val)}
              options={DURATION_OPTIONS}
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Description (optional)</label>
          <Input.TextArea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the meeting..."
            rows={3}
          />
        </div>

        {/* Agenda Items */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Agenda Items</label>
            <Button
              type="text"
              size="small"
              icon={<Plus className="h-3.5 w-3.5" />}
              onClick={handleAddAgendaItem}
              className="text-primary"
            >
              Add
            </Button>
          </div>
          <div className="space-y-2">
            {agenda.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-5 shrink-0">
                  {index + 1}.
                </span>
                <Input
                  value={item}
                  onChange={(e) => handleAgendaChange(index, e.target.value)}
                  placeholder={`Agenda item ${index + 1}`}
                  size="small"
                />
                {agenda.length > 1 && (
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<Trash2 className="h-3.5 w-3.5" />}
                    onClick={() => handleRemoveAgendaItem(index)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Invitees */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Invitees</label>
          <Select
            className="w-full"
            mode="multiple"
            value={invitees}
            onChange={(val) => setInvitees(val)}
            placeholder="Search and select members"
            options={users.map((user: IUser) => ({
              label: user.fullName,
              value: user._id,
            }))}
            optionFilterProp="label"
            showSearch
          />
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button htmlType="button" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" loading={isSubmitting}>
            {isEdit ? "Update Meeting" : "Create Meeting"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
