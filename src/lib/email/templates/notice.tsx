import { Text, Section } from "@react-email/components";
import { EmailLayout } from "./layout";

interface NoticeEmailProps {
  title: string;
  body: string;
  postedBy: string;
  date: string;
  foundationName?: string;
}

export function NoticeEmail({
  title,
  body,
  postedBy,
  date,
  foundationName = "Future Planning",
}: NoticeEmailProps) {
  return (
    <EmailLayout
      preview={`Notice: ${title}`}
      foundationName={foundationName}
    >
      <Text style={greeting}>Dear Member,</Text>
      <Text style={paragraph}>
        A new notice has been posted by {foundationName}:
      </Text>

      <Section style={noticeBox}>
        <Text style={noticeTitle}>{title}</Text>
        <Text style={noticeBody}>{body}</Text>
      </Section>

      <Text style={meta}>
        Posted by {postedBy} on {date}
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

const noticeBox = {
  backgroundColor: "#f0fdfa",
  border: "1px solid #0a9396",
  borderRadius: "6px",
  padding: "20px",
  margin: "16px 0",
};

const noticeTitle = {
  fontSize: "18px",
  fontWeight: "700" as const,
  color: "#18181b",
  margin: "0 0 12px",
};

const noticeBody = {
  fontSize: "14px",
  lineHeight: "24px",
  color: "#3f3f46",
  margin: "0",
  whiteSpace: "pre-wrap" as const,
};

const meta = {
  fontSize: "12px",
  color: "#71717a",
  margin: "0 0 16px",
};

const regards = {
  fontSize: "14px",
  lineHeight: "24px",
  color: "#3f3f46",
  margin: "24px 0 0",
};
