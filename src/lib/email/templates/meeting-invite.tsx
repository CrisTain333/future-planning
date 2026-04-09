import { Text, Section, Hr, Link, Row, Column } from "@react-email/components";
import { EmailLayout } from "./layout";

interface MeetingInviteProps {
  memberName: string;
  meetingTitle: string;
  meetingDate: string;
  meetingTime: string;
  duration: string;
  meetingType: string;
  agenda: string[];
  meetLink: string | null;
  organizer: string;
  foundationName?: string;
}

export function MeetingInviteEmail({
  memberName,
  meetingTitle,
  meetingDate,
  meetingTime,
  duration,
  meetingType,
  agenda,
  meetLink,
  organizer,
  foundationName = "Future Planning",
}: MeetingInviteProps) {
  return (
    <EmailLayout
      preview={`Meeting Invite: ${meetingTitle}`}
      foundationName={foundationName}
    >
      <Text style={greeting}>Dear {memberName},</Text>
      <Text style={paragraph}>
        You have been invited to a meeting. Here are the details:
      </Text>

      <Section style={detailBox}>
        <Text style={detailTitle}>Meeting Details</Text>
        <Hr style={detailDivider} />

        <Row style={tableRow}>
          <Column style={labelCol}>Title</Column>
          <Column style={valueCol}>{meetingTitle}</Column>
        </Row>
        <Row style={tableRow}>
          <Column style={labelCol}>Type</Column>
          <Column style={valueCol}>{meetingType}</Column>
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
        <Row style={tableRow}>
          <Column style={labelCol}>Organizer</Column>
          <Column style={valueCol}>{organizer}</Column>
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
  backgroundColor: "#f0fdfa",
  border: "1px solid #0a9396",
  borderRadius: "6px",
  padding: "20px",
  margin: "16px 0",
};

const detailTitle = {
  fontSize: "16px",
  fontWeight: "700" as const,
  color: "#0a9396",
  margin: "0 0 8px",
  textAlign: "center" as const,
};

const detailDivider = {
  borderColor: "#0a9396",
  margin: "12px 0",
  opacity: 0.3,
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
  color: "#0a9396",
  textDecoration: "underline" as const,
};

const regards = {
  fontSize: "14px",
  lineHeight: "24px",
  color: "#3f3f46",
  margin: "24px 0 0",
};
