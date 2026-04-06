import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Hr,
  Preview,
} from "@react-email/components";

interface EmailLayoutProps {
  preview: string;
  foundationName?: string;
  children: React.ReactNode;
}

export function EmailLayout({
  preview,
  foundationName = "Future Planning",
  children,
}: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={topBar} />
          <Section style={header}>
            <Text style={headerText}>{foundationName}</Text>
          </Section>
          <Hr style={divider} />
          <Section style={content}>{children}</Section>
          <Hr style={divider} />
          <Section style={footer}>
            <Text style={footerText}>
              This is an auto-generated email from {foundationName}. Please do
              not reply to this email.
            </Text>
          </Section>
          <Section style={bottomBar} />
        </Container>
      </Body>
    </Html>
  );
}

const PRIMARY = "#0a9396";

const body = {
  backgroundColor: "#f4f4f5",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  margin: "0",
  padding: "0",
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  maxWidth: "600px",
  borderRadius: "8px",
  overflow: "hidden" as const,
};

const topBar = {
  backgroundColor: PRIMARY,
  height: "4px",
};

const header = {
  padding: "32px 40px 16px",
};

const headerText = {
  color: PRIMARY,
  fontSize: "24px",
  fontWeight: "700" as const,
  margin: "0",
};

const divider = {
  borderColor: "#e4e4e7",
  margin: "0 40px",
};

const content = {
  padding: "24px 40px",
};

const footer = {
  padding: "16px 40px 24px",
};

const footerText = {
  color: "#71717a",
  fontSize: "12px",
  lineHeight: "20px",
  margin: "0",
};

const bottomBar = {
  backgroundColor: PRIMARY,
  height: "4px",
};
