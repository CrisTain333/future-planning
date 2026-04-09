import { Text, Section, Hr } from "@react-email/components";
import { EmailLayout } from "./layout";

interface ActionItem {
  title: string;
  assigneeName: string;
  dueDate: string;
}

interface MeetingMinutesProps {
  memberName: string;
  meetingTitle: string;
  meetingDate: string;
  decisions: string[];
  actionItems: ActionItem[];
  summary: string;
  foundationName?: string;
}

export function MeetingMinutesEmail({
  memberName,
  meetingTitle,
  meetingDate,
  decisions,
  actionItems,
  summary,
  foundationName = "Future Planning",
}: MeetingMinutesProps) {
  return (
    <EmailLayout
      preview={`Minutes: ${meetingTitle}`}
      foundationName={foundationName}
    >
      <Text style={greeting}>Dear {memberName},</Text>
      <Text style={paragraph}>
        The minutes for the following meeting have been published:
      </Text>

      <Section style={detailBox}>
        <Text style={detailTitle}>Meeting Minutes</Text>
        <Hr style={detailDivider} />
        <Text style={meetingName}>{meetingTitle}</Text>
        <Text style={meetingDateText}>Date: {meetingDate}</Text>
      </Section>

      <Section style={summarySection}>
        <Text style={sectionTitle}>Summary</Text>
        <Text style={summaryText}>{summary}</Text>
      </Section>

      {decisions.length > 0 && (
        <Section style={decisionsSection}>
          <Text style={sectionTitle}>Decisions</Text>
          {decisions.map((decision, index) => (
            <Text key={index} style={bulletItem}>
              &bull; {decision}
            </Text>
          ))}
        </Section>
      )}

      {actionItems.length > 0 && (
        <Section style={actionSection}>
          <Text style={sectionTitle}>Action Items</Text>
          {actionItems.map((item, index) => (
            <Section key={index} style={actionItemBox}>
              <Text style={actionItemTitle}>{item.title}</Text>
              <Text style={actionItemMeta}>
                Assigned to: {item.assigneeName} &middot; Due: {item.dueDate}
              </Text>
            </Section>
          ))}
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

const meetingName = {
  fontSize: "15px",
  fontWeight: "600" as const,
  color: "#18181b",
  margin: "0 0 4px",
  textAlign: "center" as const,
};

const meetingDateText = {
  fontSize: "13px",
  color: "#71717a",
  margin: "0",
  textAlign: "center" as const,
};

const summarySection = {
  margin: "16px 0",
};

const sectionTitle = {
  fontSize: "15px",
  fontWeight: "700" as const,
  color: "#18181b",
  margin: "0 0 8px",
};

const summaryText = {
  fontSize: "14px",
  lineHeight: "24px",
  color: "#3f3f46",
  margin: "0",
  whiteSpace: "pre-wrap" as const,
};

const decisionsSection = {
  margin: "16px 0",
};

const bulletItem = {
  fontSize: "14px",
  lineHeight: "24px",
  color: "#3f3f46",
  margin: "0",
  paddingLeft: "8px",
};

const actionSection = {
  margin: "16px 0",
};

const actionItemBox = {
  backgroundColor: "#fafafa",
  border: "1px solid #e4e4e7",
  borderRadius: "4px",
  padding: "12px",
  margin: "8px 0",
};

const actionItemTitle = {
  fontSize: "14px",
  fontWeight: "600" as const,
  color: "#18181b",
  margin: "0 0 4px",
};

const actionItemMeta = {
  fontSize: "12px",
  color: "#71717a",
  margin: "0",
};

const regards = {
  fontSize: "14px",
  lineHeight: "24px",
  color: "#3f3f46",
  margin: "24px 0 0",
};
