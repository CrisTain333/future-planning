import { Text, Section } from "@react-email/components";
import { EmailLayout } from "./layout";

interface PaymentReminderProps {
  memberName: string;
  amount: number;
  monthName: string;
  year: number;
  foundationName?: string;
}

export function PaymentReminderEmail({
  memberName,
  amount,
  monthName,
  year,
  foundationName = "Future Planning",
}: PaymentReminderProps) {
  return (
    <EmailLayout
      preview={`Payment reminder for ${monthName} ${year}`}
      foundationName={foundationName}
    >
      <Text style={greeting}>Dear {memberName},</Text>
      <Text style={paragraph}>
        This is a friendly reminder that your monthly payment of{" "}
        <strong>BDT {amount.toLocaleString()}</strong> for{" "}
        <strong>
          {monthName} {year}
        </strong>{" "}
        is still pending.
      </Text>
      <Section style={highlightBox}>
        <Text style={highlightText}>
          Amount Due: BDT {amount.toLocaleString()}
        </Text>
        <Text style={highlightText}>
          Period: {monthName} {year}
        </Text>
      </Section>
      <Text style={paragraph}>
        Please make your payment at the earliest convenience to avoid any
        penalties.
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

const highlightBox = {
  backgroundColor: "#f0fdfa",
  border: "1px solid #0a9396",
  borderRadius: "6px",
  padding: "16px 20px",
  margin: "16px 0",
};

const highlightText = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#18181b",
  margin: "0",
  fontWeight: "600" as const,
};

const regards = {
  fontSize: "14px",
  lineHeight: "24px",
  color: "#3f3f46",
  margin: "24px 0 0",
};
