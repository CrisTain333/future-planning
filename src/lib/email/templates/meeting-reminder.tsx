import { Text, Section, Hr, Link, Row, Column } from "@react-email/components";
import { EmailLayout } from "./layout";

interface MeetingReminderProps {
  memberName: string;
  meetingTitle: string;
  meetingDate: string;
  meetingTime: string;
  duration: string;
  agenda: string[];
  meetLink: string | null;
  foundationName?: string;
}

export function MeetingReminderEmail({
  memberName,
  meetingTitle,
  meetingDate,
  meetingTime,
  duration,
  agenda,
  meetLink,
  foundationName = "Future Planning",
}: MeetingReminderProps) {
  return (
    <EmailLayout
      preview={`Reminder: ${meetingTitle}`}
      foundationName={foundationName}
    >
      <Text style={greeting}>Dear {memberName},</Text>
      <Text style={paragraph}>
        This is a reminder for your upcoming meeting:
      </Text>

      <Section style={detailBox}>
        <Text style={detailTitle}>Meeting Reminder</Text>
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
        <Row style={tableRow}>
          <Column style={labelCol}>Duration</Column>
          <Column style={valueCol}>{duration}</Column>
        </Row>
      </Section>

      {agenda.length > 0 && (
        <Section style={agendaSection}>
          <Text style={sectionTitle}>Agenda</Text>
          {agenda.map((item, index) => (
            <Text key={index} style={agendaItem}>
              {index + 1}. {item}
            </Text>
          ))}
        </Section>
      )}

      {meetLink && (
        <Section style={linkSection}>
          <Text style={paragraph}>
            Join via Google Meet:{" "}
            <Link href={meetLink} style={meetLinkStyle}>
              {meetLink}
            </Link>
          </Text>
        </Section>
      )}

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
  backgroundColor: "#fffbeb",
  border: "1px solid #fde68a",
  borderRadius: "6px",
  padding: "20px",
  margin: "16px 0",
};

const detailTitle = {
  fontSize: "16px",
  fontWeight: "700" as const,
  color: "#d97706",
  margin: "0 0 8px",
  textAlign: "center" as const,
};

const detailDivider = {
  borderColor: "#fde68a",
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

const agendaSection = {
  margin: "16px 0",
};

const sectionTitle = {
  fontSize: "15px",
  fontWeight: "700" as const,
  color: "#18181b",
  margin: "0 0 8px",
};

const agendaItem = {
  fontSize: "14px",
  lineHeight: "24px",
  color: "#3f3f46",
  margin: "0",
  paddingLeft: "8px",
};

const linkSection = {
  margin: "16px 0",
};

const meetLinkStyle = {
  color: "#d97706",
  textDecoration: "underline" as const,
};

const regards = {
  fontSize: "14px",
  lineHeight: "24px",
  color: "#3f3f46",
  margin: "24px 0 0",
};
