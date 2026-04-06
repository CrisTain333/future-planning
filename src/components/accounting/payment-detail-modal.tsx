"use client";

import { Modal, Descriptions, Tag, Timeline, Spin } from "antd";
import { IPayment, IUser } from "@/types";
import { FileDown } from "lucide-react";
import { useGetPaymentHistoryQuery } from "@/store/payments-api";

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

interface PaymentDetailModalProps {
  open: boolean;
  onClose: () => void;
  payment: IPayment | null;
}

export function PaymentDetailModal({ open, onClose, payment }: PaymentDetailModalProps) {
  const { data: historyData, isLoading: historyLoading } = useGetPaymentHistoryQuery(
    payment?._id ?? "",
    { skip: !payment }
  );
  const history = historyData?.data || [];

  if (!payment) return null;

  const memberName = payment.userId && typeof payment.userId === "object" ? (payment.userId as IUser).fullName : "Unknown";
  const approvedByName = payment.approvedBy && typeof payment.approvedBy === "object" ? (payment.approvedBy as IUser).fullName : "Unknown";
  const total = payment.amount + payment.penalty;

  const handleDownloadReceipt = () => {
    window.open(`/api/payments/${payment._id}/receipt`, "_blank");
  };

  return (
    <Modal
      title="Payment Details"
      open={open}
      onCancel={onClose}
      footer={[
        <button
          key="receipt"
          onClick={handleDownloadReceipt}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <FileDown className="h-4 w-4" />
          Download Receipt
        </button>,
      ]}
      width={600}
    >
      <div className="py-4">
        <Descriptions bordered column={1} size="small" labelStyle={{ fontWeight: 600, width: "160px" }}>
          <Descriptions.Item label="Receipt No">
            <Tag color="blue">{payment.receiptNo}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Member">{memberName}</Descriptions.Item>
          <Descriptions.Item label="Month">{MONTH_NAMES[payment.month - 1]} {payment.year}</Descriptions.Item>
          <Descriptions.Item label="Amount">
            <span className="text-lg font-bold">৳{payment.amount.toLocaleString()}</span>
          </Descriptions.Item>
          {payment.penalty > 0 && (
            <>
              <Descriptions.Item label="Penalty">
                <span className="text-red-500 font-medium">৳{payment.penalty.toLocaleString()}</span>
              </Descriptions.Item>
              {payment.penaltyReason && (
                <Descriptions.Item label="Penalty Reason">{payment.penaltyReason}</Descriptions.Item>
              )}
            </>
          )}
          <Descriptions.Item label="Total">
            <span className="text-lg font-bold text-primary">৳{total.toLocaleString()}</span>
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={payment.status === "approved" ? "green" : "red"}>{payment.status.toUpperCase()}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Recorded By">{approvedByName}</Descriptions.Item>
          <Descriptions.Item label="Recorded On">
            {new Date(payment.createdAt).toLocaleDateString("en-US", {
              year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
            })}
          </Descriptions.Item>
          {payment.note && (
            <Descriptions.Item label="Note">{payment.note}</Descriptions.Item>
          )}
        </Descriptions>

        {/* Change History */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Change History</h3>
          {historyLoading ? (
            <div className="flex justify-center py-4"><Spin size="small" /></div>
          ) : history.length === 0 ? (
            <p className="text-xs text-muted-foreground">No change history available</p>
          ) : (
            <Timeline
              items={history.map((log: any) => {
                const action = log.action as string;
                const by = typeof log.performedBy === "object" && log.performedBy
                  ? (log.performedBy as { fullName: string }).fullName
                  : "System";
                const desc = log.details?.action_description || action.replace(/_/g, " ");
                const changes = Array.isArray(log.details?.changes) ? log.details.changes : [];
                const date = new Date(log.createdAt).toLocaleDateString("en-US", {
                  month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
                });

                const color = action === "payment_created" ? "green"
                  : action === "payment_edited" ? "blue"
                  : action === "payment_deleted" ? "red"
                  : action === "payment_archived" ? "orange"
                  : action === "payment_unarchived" ? "cyan" : "gray";

                return {
                  color,
                  children: (
                    <div>
                      <p className="text-sm font-medium">{desc}</p>
                      <p className="text-xs text-muted-foreground">by {by} · {date}</p>
                      {changes.length > 0 && (
                        <div className="mt-1 text-xs space-y-0.5 pl-2 border-l-2 border-primary/20">
                          {changes.map((c: { field: string; from?: unknown; to?: unknown }, i: number) => {
                            const formatValue = (field: string, val: unknown) =>
                              field === "month" && typeof val === "number"
                                ? MONTH_NAMES[val - 1] || String(val)
                                : String(val);
                            return (
                              <div key={i} className="text-muted-foreground">
                                <span className="font-medium capitalize">{c.field.replace(/_/g, " ")}:</span>{" "}
                                {c.from !== undefined && (
                                  <><span className="line-through text-red-500">{formatValue(c.field, c.from)}</span> &rarr; </>
                                )}
                                <span className="text-emerald-600">{formatValue(c.field, c.to)}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ),
                };
              })}
            />
          )}
        </div>
      </div>
    </Modal>
  );
}
