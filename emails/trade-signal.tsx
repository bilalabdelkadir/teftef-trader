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
  Row,
  Column,
} from "@react-email/components";

export interface TradeSignalEmailProps {
  userName: string;
  symbol: string;
  direction: "BUY" | "SELL";
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  riskReward: number;
  confidence: number;
  reasoning: string;
  appUrl?: string;
}

export function TradeSignalEmail({
  userName = "Trader",
  symbol = "EURUSD",
  direction = "BUY",
  entryPrice = 1.08500,
  stopLoss = 1.08200,
  takeProfit = 1.09100,
  riskReward = 2.0,
  confidence = 75,
  reasoning = "Strong bullish momentum with support at key levels.",
  appUrl = "https://teftef.trade",
}: TradeSignalEmailProps) {
  const directionColor = direction === "BUY" ? "#22c55e" : "#ef4444";
  const directionEmoji = direction === "BUY" ? "📈" : "📉";
  const confidenceColor =
    confidence >= 80 ? "#22c55e" : confidence >= 60 ? "#eab308" : "#ef4444";

  return (
    <Html>
      <Head />
      <Preview>
        {`${directionEmoji} ${direction} Signal: ${symbol} (${confidence}% confidence)`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>
            {directionEmoji} Trade Signal Alert
          </Heading>
          <Text style={subheading}>
            Hi {userName}, we found a potential trade setup for you.
          </Text>

          <Section style={card}>
            <Row>
              <Column>
                <Text style={symbolText}>{symbol}</Text>
              </Column>
              <Column align="right">
                <Text
                  style={{
                    ...badge,
                    backgroundColor: `${directionColor}20`,
                    color: directionColor,
                  }}
                >
                  {direction}
                </Text>
              </Column>
            </Row>

            <Section style={priceGrid}>
              <Row>
                <Column style={priceColumn}>
                  <Text style={priceLabel}>Entry</Text>
                  <Text style={priceValue}>${entryPrice.toFixed(5)}</Text>
                </Column>
                <Column style={priceColumn}>
                  <Text style={{ ...priceLabel, color: "#ef4444" }}>
                    Stop Loss
                  </Text>
                  <Text style={{ ...priceValue, color: "#ef4444" }}>
                    ${stopLoss.toFixed(5)}
                  </Text>
                </Column>
                <Column style={priceColumn}>
                  <Text style={{ ...priceLabel, color: "#22c55e" }}>
                    Take Profit
                  </Text>
                  <Text style={{ ...priceValue, color: "#22c55e" }}>
                    ${takeProfit.toFixed(5)}
                  </Text>
                </Column>
              </Row>
            </Section>

            <Hr style={divider} />

            <Row>
              <Column>
                <Text style={metricLabel}>Risk/Reward</Text>
                <Text style={metricValue}>1:{riskReward.toFixed(2)}</Text>
              </Column>
              <Column>
                <Text style={metricLabel}>Confidence</Text>
                <Text style={{ ...metricValue, color: confidenceColor }}>
                  {confidence}%
                </Text>
              </Column>
            </Row>
          </Section>

          <Section style={card}>
            <Text style={analysisLabel}>AI Analysis</Text>
            <Text style={analysisText}>
              {reasoning.length > 500
                ? `${reasoning.substring(0, 500)}...`
                : reasoning}
            </Text>
          </Section>

          <Button style={button} href={`${appUrl}/signals`}>
            View All Signals
          </Button>

          <Text style={footer}>
            This is an automated alert from TefTef Trader. Trade responsibly.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default TradeSignalEmail;

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
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0 0 8px 0",
};

const subheading = {
  color: "#a3a3a3",
  fontSize: "14px",
  margin: "0 0 24px 0",
};

const card = {
  backgroundColor: "#262626",
  borderRadius: "8px",
  padding: "20px",
  marginBottom: "20px",
};

const symbolText = {
  color: "#fafafa",
  fontFamily: "monospace",
  fontSize: "28px",
  fontWeight: "bold",
  margin: "0",
};

const badge = {
  display: "inline-block",
  padding: "4px 12px",
  borderRadius: "9999px",
  fontWeight: "600",
  fontSize: "14px",
  margin: "0",
};

const priceGrid = {
  marginTop: "16px",
};

const priceColumn = {
  padding: "0 8px",
};

const priceLabel = {
  color: "#a3a3a3",
  fontSize: "12px",
  margin: "0 0 4px 0",
};

const priceValue = {
  color: "#fafafa",
  fontFamily: "monospace",
  fontSize: "16px",
  margin: "0",
};

const divider = {
  borderColor: "#404040",
  margin: "16px 0",
};

const metricLabel = {
  color: "#a3a3a3",
  fontSize: "12px",
  margin: "0 0 4px 0",
};

const metricValue = {
  color: "#fafafa",
  fontSize: "18px",
  fontWeight: "600",
  margin: "0",
};

const analysisLabel = {
  color: "#a3a3a3",
  fontSize: "12px",
  margin: "0 0 8px 0",
};

const analysisText = {
  color: "#fafafa",
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "0",
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
