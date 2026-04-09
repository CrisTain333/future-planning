import { Text, Section, Hr, Row, Column } from "@react-email/components";
import { EmailLayout } from "./layout";

interface MeetingCancelledProps {
  memberName: string;
  meetingTitle: string;
  meetingDate: string;
  meetingTime: string;
  reason: string;
  cancelledBy: string;
  foundationName?: string;
}

export function MeetingCancelledEmail({
  memberName,
  meetingTitle,
  meetingDate,
  meetingTime,
  reason,
  cancelledBy,
  foundationName = "Future Planning",
}: MeetingCancelledProps) {
  return (
    <EmailLayout
      preview={`Meeting Cancelled: ${meetingTitle}`}
      foundationName={foundationName}
    >
      <Text style={greeting}>Dear {memberName},</Text>
      <Text style={paragraph}>
        The following meeting has been cancelled:
      </Text>

      <Section style={detailBox}>
        <Text style={detailTitle}>Meeting Cancelled</Text>
        <Hr style={detailDivider} />

        <Row style={tableRow}>
          <Column style={labelCol}>Title</Column>
          <Column style={valueCol}>{meetingTitle}</Column>
        </Row>
        <Row style={tableRow}>
          <Column style={labelCol}>Date</Column>
          <Column style={valueCol}>{meetingDate}</Column>
        </Row>
        <Row style={tableRow}>
          <Column style={labelCol}>Time</Column>
          <Column style={valueCol}>{meetingTime}</Column>
        </Row>
        <Hr style={detailDivider} />
        <Row style={tableRow}>
          <Column style={labelCol}>Cancelled By</Column>
          <Column style={valueCol}>{cancelledBy}</Column>
        </Row>
        <Row style={tableRow}>
          <Column style={labelCol}>Reason</Column>
          <Column style={valueCol}>{reason}</Column>
        </Row>
      </Section>

      <Text style={paragraph}>
        We apologize for any inconvenience. A new meeting may be scheduled in
        the future.
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

const detailBox = {
  backgroundColor: "#fef2f2",
  border: "1px solid #fecaca",
  borderRadius: "6px",
  padding: "20px",
  margin: "16px 0",
};

const detailTitle = {
  fontSize: "16px",
  fontWeight: "700" as const,
  color: "#dc2626",
  margin: "0 0 8px",
  textAlign: "center" as const,
};

const detailDivider = {
  borderColor: "#fecaca",
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

const regards = {
  fontSize: "14px",
  lineHeight: "24px",
  color: "#3f3f46",
  margin: "24px 0 0",
};
