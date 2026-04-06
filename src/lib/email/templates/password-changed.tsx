import { Text, Section } from "@react-email/components";
import { EmailLayout } from "./layout";

interface PasswordChangedProps {
  memberName: string;
  newPassword: string;
  foundationName?: string;
}

export function PasswordChangedEmail({
  memberName,
  newPassword,
  foundationName = "Future Planning",
}: PasswordChangedProps) {
  return (
    <EmailLayout
      preview="Your password has been changed"
      foundationName={foundationName}
    >
      <Text style={greeting}>Dear {memberName},</Text>
      <Text style={paragraph}>
        Your account password has been changed by an administrator.
      </Text>

      <Section style={passwordBox}>
        <Text style={passwordLabel}>Your New Password</Text>
        <Text style={passwordValue}>{newPassword}</Text>
      </Section>

      <Section style={warningBox}>
        <Text style={warningText}>
          For your security, please change your password after logging in. Go to
          your Profile and use the Change Password option.
        </Text>
      </Section>

      <Text style={paragraph}>
        If you did not expect this change, please contact your administrator
        immediately.
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

const passwordBox = {
  backgroundColor: "#f0fdfa",
  border: "1px solid #0a9396",
  borderRadius: "6px",
  padding: "20px",
  margin: "16px 0",
  textAlign: "center" as const,
};

const passwordLabel = {
  fontSize: "12px",
  color: "#71717a",
  margin: "0 0 8px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
};

const passwordValue = {
  fontSize: "24px",
  fontWeight: "700" as const,
  color: "#18181b",
  margin: "0",
  fontFamily: "monospace",
  letterSpacing: "0.1em",
};

const warningBox = {
  backgroundColor: "#fef3c7",
  border: "1px solid #f59e0b",
  borderRadius: "6px",
  padding: "12px 16px",
  margin: "16px 0",
};

const warningText = {
  fontSize: "13px",
  lineHeight: "20px",
  color: "#92400e",
  margin: "0",
};

const regards = {
  fontSize: "14px",
  lineHeight: "24px",
  color: "#3f3f46",
  margin: "24px 0 0",
};
