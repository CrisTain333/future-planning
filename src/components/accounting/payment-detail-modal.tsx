"use client";

import { Modal, Descriptions, Tag } from "antd";
import { IPayment, IUser } from "@/types";
import { FileDown } from "lucide-react";

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

interface PaymentDetailModalProps {
  open: boolean;
  onClose: () => void;
  payment: IPayment | null;
}

export function PaymentDetailModal({ open, onClose, payment }: PaymentDetailModalProps) {
  if (!payment) return null;

  const memberName = typeof payment.userId === "object" ? (payment.userId as IUser).fullName : "Unknown";
  const approvedByName = typeof payment.approvedBy === "object" ? (payment.approvedBy as IUser).fullName : "Unknown";
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
      </div>
    </Modal>
  );
}
