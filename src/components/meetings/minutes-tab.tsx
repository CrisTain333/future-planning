"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Button,
  Input,
  Select,
  Tag,
  Segmented,
  Popconfirm,
  DatePicker,
} from "antd";
import { Plus, Trash2 } from "lucide-react";
import { IMeeting, IUser, IActionItem } from "@/types";
import {
  useUpdateMinutesMutation,
  useSendMinutesMutation,
} from "@/store/meetings-api";
import toast from "react-hot-toast";
import dayjs from "dayjs";

interface MinutesTabProps {
  meeting: IMeeting;
}

interface AgendaItemForm {
  title: string;
  discussion: string;
  decision: string;
}

interface ActionItemForm {
  title: string;
  assignee: string;
  dueDate: string;
  status: "pending" | "done";
}

export function MinutesTab({ meeting }: MinutesTabProps) {
  const minutes = meeting.minutes;
  const isFinalized = minutes?.status === "finalized";

  const [mode, setMode] = useState<"structured" | "freeform">(
    minutes?.mode ?? "structured"
  );
  const [freeformContent, setFreeformContent] = useState(
    minutes?.freeformContent ?? ""
  );
  const [agendaItems, setAgendaItems] = useState<AgendaItemForm[]>(() => {
    if (minutes?.agendaItems?.length) {
      return minutes.agendaItems.map((ai) => ({
        title: ai.title,
        discussion: ai.discussion,
        decision: ai.decision,
      }));
    }
    // Initialize from meeting agenda
    return (meeting.agenda ?? []).map((title) => ({
      title,
      discussion: "",
      decision: "",
    }));
  });
  const [decisions, setDecisions] = useState<string[]>(
    minutes?.decisions ?? []
  );
  const [actionItems, setActionItems] = useState<ActionItemForm[]>(
    () =>
      minutes?.actionItems?.map((ai: IActionItem) => ({
        title: ai.title,
        assignee:
          typeof ai.assignee === "object"
            ? (ai.assignee as IUser)._id
            : ai.assignee,
        dueDate: ai.dueDate ?? "",
        status: ai.status,
      })) ?? []
  );

  const [updateMinutes, { isLoading: isSaving }] = useUpdateMinutesMutation();
  const [sendMinutes, { isLoading: isSending }] = useSendMinutesMutation();

  // Auto-collect decisions from agenda items
  useEffect(() => {
    const agendaDecisions = agendaItems
      .map((ai) => ai.decision)
      .filter((d) => d.trim() !== "");
    // Merge: agenda decisions + any manually added decisions not from agenda
    const manualDecisions = decisions.filter(
      (d) => !agendaItems.some((ai) => ai.decision === d)
    );
    const merged = [...agendaDecisions, ...manualDecisions];
    // Only update if actually changed to avoid infinite loop
    if (JSON.stringify(merged) !== JSON.stringify(decisions)) {
      setDecisions(merged);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agendaItems]);

  const inviteeOptions = (meeting.invitees ?? []).map((inv) => {
    const user = inv as IUser;
    return { value: user._id, label: user.fullName };
  });

  const handleSave = useCallback(
    async (finalize: boolean) => {
      try {
        await updateMinutes({
          id: meeting._id,
          body: {
            mode,
            freeformContent,
            agendaItems,
            decisions,
            actionItems: actionItems.map((ai) => ({
              title: ai.title,
              assignee: ai.assignee,
              dueDate: ai.dueDate,
            })),
            status: finalize ? "finalized" : "draft",
          },
        }).unwrap();
        toast.success(finalize ? "Minutes finalized" : "Draft saved");
      } catch {
        toast.error("Failed to save minutes");
      }
    },
    [
      meeting._id,
      mode,
      freeformContent,
      agendaItems,
      decisions,
      actionItems,
      updateMinutes,
    ]
  );

  const handleSend = useCallback(async () => {
    try {
      await sendMinutes(meeting._id).unwrap();
      toast.success("Minutes sent to invitees");
    } catch {
      toast.error("Failed to send minutes");
    }
  }, [meeting._id, sendMinutes]);

  const updateAgendaItem = (
    index: number,
    field: keyof AgendaItemForm,
    value: string
  ) => {
    setAgendaItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addDecision = () => setDecisions((prev) => [...prev, ""]);
  const removeDecision = (index: number) =>
    setDecisions((prev) => prev.filter((_, i) => i !== index));
  const updateDecision = (index: number, value: string) =>
    setDecisions((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });

  const addActionItem = () =>
    setActionItems((prev) => [
      ...prev,
      { title: "", assignee: "", dueDate: "", status: "pending" as const },
    ]);
  const removeActionItem = (index: number) =>
    setActionItems((prev) => prev.filter((_, i) => i !== index));
  const updateActionItem = (
    index: number,
    field: keyof ActionItemForm,
    value: string
  ) =>
    setActionItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <Segmented
        options={[
          { value: "structured", label: "Structured" },
          { value: "freeform", label: "Freeform" },
        ]}
        value={mode}
        onChange={(val) => setMode(val as "structured" | "freeform")}
        disabled={isFinalized}
      />

      {mode === "freeform" ? (
        /* Freeform Mode */
        <Input.TextArea
          value={freeformContent}
          onChange={(e) => setFreeformContent(e.target.value)}
          placeholder="Type meeting minutes here..."
          rows={12}
          disabled={isFinalized}
        />
      ) : (
        /* Structured Mode */
        <div className="space-y-6">
          {/* Agenda Items */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Agenda Items</h4>
            {agendaItems.map((item, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-white/10 p-3 space-y-2"
              >
                <p className="text-sm font-medium">{item.title}</p>
                <Input.TextArea
                  value={item.discussion}
                  onChange={(e) =>
                    updateAgendaItem(idx, "discussion", e.target.value)
                  }
                  placeholder="Discussion notes..."
                  rows={2}
                  disabled={isFinalized}
                />
                <Input.TextArea
                  value={item.decision}
                  onChange={(e) =>
                    updateAgendaItem(idx, "decision", e.target.value)
                  }
                  placeholder="Decision made..."
                  rows={1}
                  disabled={isFinalized}
                />
              </div>
            ))}
          </div>

          {/* Decisions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Decisions</h4>
              {!isFinalized && (
                <Button
                  type="text"
                  size="small"
                  icon={<Plus className="h-3.5 w-3.5" />}
                  onClick={addDecision}
                >
                  Add
                </Button>
              )}
            </div>
            {decisions.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No decisions recorded yet.
              </p>
            )}
            {decisions.map((dec, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  value={dec}
                  onChange={(e) => updateDecision(idx, e.target.value)}
                  placeholder="Decision..."
                  size="small"
                  disabled={isFinalized}
                />
                {!isFinalized && (
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<Trash2 className="h-3.5 w-3.5" />}
                    onClick={() => removeDecision(idx)}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Action Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Action Items</h4>
              {!isFinalized && (
                <Button
                  type="text"
                  size="small"
                  icon={<Plus className="h-3.5 w-3.5" />}
                  onClick={addActionItem}
                >
                  Add
                </Button>
              )}
            </div>
            {actionItems.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No action items yet.
              </p>
            )}
            {actionItems.map((ai, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-white/10 p-3 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <Input
                    value={ai.title}
                    onChange={(e) =>
                      updateActionItem(idx, "title", e.target.value)
                    }
                    placeholder="Action item title..."
                    size="small"
                    disabled={isFinalized}
                    className="flex-1"
                  />
                  <Tag color={ai.status === "done" ? "green" : "gold"}>
                    {ai.status === "done" ? "Done" : "Pending"}
                  </Tag>
                  {!isFinalized && (
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<Trash2 className="h-3.5 w-3.5" />}
                      onClick={() => removeActionItem(idx)}
                    />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={ai.assignee || undefined}
                    onChange={(val) => updateActionItem(idx, "assignee", val)}
                    options={inviteeOptions}
                    placeholder="Assignee"
                    size="small"
                    className="flex-1"
                    disabled={isFinalized}
                  />
                  <DatePicker
                    value={ai.dueDate ? dayjs(ai.dueDate) : null}
                    onChange={(date) =>
                      updateActionItem(
                        idx,
                        "dueDate",
                        date ? date.toISOString() : ""
                      )
                    }
                    size="small"
                    disabled={isFinalized}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="flex items-center gap-2 pt-2 border-t border-white/10">
        {!isFinalized && (
          <>
            <Button onClick={() => handleSave(false)} loading={isSaving}>
              Save Draft
            </Button>
            <Popconfirm
              title="Finalize these minutes?"
              description="Once finalized, minutes cannot be edited."
              onConfirm={() => handleSave(true)}
              okText="Finalize"
              cancelText="Cancel"
            >
              <Button
                type="primary"
                style={{ backgroundColor: "#40916c", borderColor: "#40916c" }}
                loading={isSaving}
              >
                Finalize Minutes
              </Button>
            </Popconfirm>
          </>
        )}
        {isFinalized && (
          <Button
            type="primary"
            style={{ backgroundColor: "#40916c", borderColor: "#40916c" }}
            onClick={handleSend}
            loading={isSending}
          >
            Send to Invitees
          </Button>
        )}
      </div>
    </div>
  );
}
