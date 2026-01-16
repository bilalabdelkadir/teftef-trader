import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Button,
  Hr,
} from "@react-email/components";

export interface WelcomeEmailProps {
  userName: string;
  appUrl?: string;
}

export function WelcomeEmail({
  userName = "Trader",
  appUrl = "https://teftef.trade",
}: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to TefTef Trader - Your AI-powered trading companion</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Welcome to TefTef Trader!</Heading>
          <Text style={greeting}>
            Hi {userName}, thank you for joining TefTef Trader. You're now part
            of a community of traders using AI-powered analysis to make better
            trading decisions.
          </Text>

          <Section style={card}>
            <Heading as="h2" style={sectionHeading}>
              Quick Start Guide
            </Heading>
            <Hr style={divider} />

            <Section style={step}>
              <Text style={stepNumber}>1</Text>
              <Text style={stepText}>
                <strong>Complete your onboarding</strong> - Set up your watchlist
                with the markets you want to trade.
              </Text>
            </Section>

            <Section style={step}>
              <Text style={stepNumber}>2</Text>
              <Text style={stepText}>
                <strong>Configure your risk settings</strong> - Tell us your
                account size and risk tolerance so we can calculate proper
                position sizes.
              </Text>
            </Section>

            <Section style={step}>
              <Text style={stepNumber}>3</Text>
              <Text style={stepText}>
                <strong>Start receiving signals</strong> - Our AI will scan your
                watchlist twice daily and alert you to high-confidence trading
                opportunities.
              </Text>
            </Section>
          </Section>

          <Button style={button} href={`${appUrl}/dashboard`}>
            Go to Dashboard
          </Button>

          <Text style={footer}>
            If you have any questions, simply reply to this email. We're here to
            help!
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default WelcomeEmail;

const main = {
  backgroundColor: "#0a0a0a",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  padding: "20px",
};

const container = {
  maxWidth: "600px",
  margin: "0 auto",
  backgroundColor: "#171717",
  borderRadius: "12px",
  padding: "24px",
};

const heading = {
  color: "#fafafa",
  fontSize: "28px",
  fontWeight: "bold",
  margin: "0 0 16px 0",
};

const greeting = {
  color: "#a3a3a3",
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "0 0 24px 0",
};

const card = {
  backgroundColor: "#262626",
  borderRadius: "8px",
  padding: "20px",
  marginBottom: "24px",
};

const sectionHeading = {
  color: "#fafafa",
  fontSize: "18px",
  fontWeight: "600",
  margin: "0 0 12px 0",
};

const divider = {
  borderColor: "#404040",
  margin: "0 0 16px 0",
};

const step = {
  marginBottom: "16px",
};

const stepNumber = {
  display: "inline-block",
  width: "24px",
  height: "24px",
  lineHeight: "24px",
  textAlign: "center" as const,
  backgroundColor: "#fafafa",
  color: "#0a0a0a",
  borderRadius: "50%",
  fontSize: "12px",
  fontWeight: "bold",
  margin: "0 12px 0 0",
  verticalAlign: "top",
};

const stepText = {
  display: "inline-block",
  color: "#a3a3a3",
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "0",
  maxWidth: "calc(100% - 40px)",
  verticalAlign: "top",
};

const button = {
  display: "block",
  textAlign: "center" as const,
  backgroundColor: "#fafafa",
  color: "#0a0a0a",
  padding: "12px 24px",
  borderRadius: "8px",
  textDecoration: "none",
  fontWeight: "600",
  fontSize: "14px",
  marginBottom: "20px",
};

const footer = {
  color: "#737373",
  fontSize: "12px",
  textAlign: "center" as const,
  margin: "0",
};
