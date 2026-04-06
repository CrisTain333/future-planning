import { Text, Section, Row, Column, Hr } from "@react-email/components";
import { EmailLayout } from "./layout";

interface PaymentReceiptProps {
  memberName: string;
  receiptNo: string;
  monthName: string;
  year: number;
  amount: number;
  penalty: number;
  penaltyReason?: string;
  approvedBy: string;
  date: string;
  foundationName?: string;
}

export function PaymentReceiptEmail({
  memberName,
  receiptNo,
  monthName,
  year,
  amount,
  penalty,
  penaltyReason,
  approvedBy,
  date,
  foundationName = "Future Planning",
}: PaymentReceiptProps) {
  const total = amount + penalty;

  return (
    <EmailLayout
      preview={`Payment receipt ${receiptNo}`}
      foundationName={foundationName}
    >
      <Text style={greeting}>Dear {memberName},</Text>
      <Text style={paragraph}>
        Your payment has been recorded successfully. Here are the details:
      </Text>

      <Section style={receiptBox}>
        <Text style={receiptTitle}>Payment Receipt</Text>
        <Hr style={receiptDivider} />

        <Row style={tableRow}>
          <Column style={labelCol}>Receipt No</Column>
          <Column style={valueCol}>{receiptNo}</Column>
        </Row>
        <Row style={tableRow}>
          <Column style={labelCol}>Date</Column>
          <Column style={valueCol}>{date}</Column>
        </Row>
        <Row style={tableRow}>
          <Column style={labelCol}>Period</Column>
          <Column style={valueCol}>
            {monthName} {year}
          </Column>
        </Row>
        <Row style={tableRow}>
          <Column style={labelCol}>Amount</Column>
          <Column style={valueCol}>BDT {amount.toLocaleString()}</Column>
        </Row>
        {penalty > 0 && (
          <>
            <Row style={tableRow}>
              <Column style={labelCol}>Penalty</Column>
              <Column style={valueCol}>BDT {penalty.toLocaleString()}</Column>
            </Row>
            {penaltyReason && (
              <Row style={tableRow}>
                <Column style={labelCol}>Penalty Reason</Column>
                <Column style={valueCol}>{penaltyReason}</Column>
              </Row>
            )}
          </>
        )}
        <Hr style={receiptDivider} />
        <Row style={tableRow}>
          <Column style={labelCol}>
            <strong>Total</strong>
          </Column>
          <Column style={valueColBold}>BDT {total.toLocaleString()}</Column>
        </Row>
        <Row style={tableRow}>
          <Column style={labelCol}>Status</Column>
          <Column style={statusBadge}>Approved</Column>
        </Row>
        <Row style={tableRow}>
          <Column style={labelCol}>Approved By</Column>
          <Column style={valueCol}>{approvedBy}</Column>
        </Row>
      </Section>

      <Text style={paragraph}>
        This serves as your official payment receipt from {foundationName}.
      </Text>
      <Text style={regards}>
        Best regards,
        <br />
        {foundationName}
      </Text>
    </EmailLayout>
  );
}

const greeting = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#18181b",
  margin: "0 0 16px",
};

const paragraph = {
  fontSize: "14px",
  lineHeight: "24px",
  color: "#3f3f46",
  margin: "0 0 16px",
};

const receiptBox = {
  backgroundColor: "#fafafa",
  border: "1px solid #e4e4e7",
  borderRadius: "6px",
  padding: "20px",
  margin: "16px 0",
};

const receiptTitle = {
  fontSize: "16px",
  fontWeight: "700" as const,
  color: "#0a9396",
  margin: "0 0 8px",
  textAlign: "center" as const,
};

const receiptDivider = {
  borderColor: "#e4e4e7",
  margin: "12px 0",
};

const tableRow = {
  margin: "0",
};

const labelCol = {
  fontSize: "13px",
  color: "#71717a",
  padding: "4px 0",
  width: "140px",
};

const valueCol = {
  fontSize: "13px",
  color: "#18181b",
  padding: "4px 0",
};

const valueColBold = {
  fontSize: "14px",
  color: "#18181b",
  fontWeight: "700" as const,
  padding: "4px 0",
};

const statusBadge = {
  fontSize: "13px",
  color: "#0a9396",
  fontWeight: "600" as const,
  padding: "4px 0",
};

const regards = {
  fontSize: "14px",
  lineHeight: "24px",
  color: "#3f3f46",
  margin: "24px 0 0",
};
