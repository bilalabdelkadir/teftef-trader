import { Resend } from "resend";
import { render } from "@react-email/components";
import { TradeSignalEmail, TradeSignalEmailProps } from "@/emails/trade-signal";
import { WelcomeEmail, WelcomeEmailProps } from "@/emails/welcome";

const resend = new Resend(process.env.RESEND_API_KEY);

interface TradeSignalEmailData {
  to: string;
  userName: string;
  symbol: string;
  direction: "BUY" | "SELL";
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  riskReward: number;
  confidence: number;
  reasoning: string;
}

export async function sendTradeSignalEmail(data: TradeSignalEmailData) {
  const {
    to,
    userName,
    symbol,
    direction,
    entryPrice,
    stopLoss,
    takeProfit,
    riskReward,
    confidence,
    reasoning,
  } = data;

  const directionEmoji = direction === "BUY" ? "📈" : "📉";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://teftef.trade";

  const emailProps: TradeSignalEmailProps = {
    userName,
    symbol,
    direction,
    entryPrice,
    stopLoss,
    takeProfit,
    riskReward,
    confidence,
    reasoning,
    appUrl,
  };

  const html = await render(TradeSignalEmail(emailProps));

  try {
    const domain = process.env.RESEND_DOMAIN || "teftef.trade";
    const result = await resend.emails.send({
      from: `TefTef Trader <alerts@${domain}>`,
      to: [to],
      subject: `${directionEmoji} ${direction} Signal: ${symbol} (${confidence}% confidence)`,
      html,
    });

    return { success: true, id: result.data?.id };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error };
  }
}

interface WelcomeEmailData {
  to: string;
  userName: string;
}

export async function sendWelcomeEmail(data: WelcomeEmailData) {
  const { to, userName } = data;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://teftef.trade";

  const emailProps: WelcomeEmailProps = {
    userName,
    appUrl,
  };

  const html = await render(WelcomeEmail(emailProps));

  try {
    const domain = process.env.RESEND_DOMAIN || "teftef.trade";
    const result = await resend.emails.send({
      from: `TefTef Trader <hello@${domain}>`,
      to: [to],
      subject: "Welcome to TefTef Trader!",
      html,
    });

    return { success: true, id: result.data?.id };
  } catch (error) {
    console.error("Failed to send welcome email:", error);
    return { success: false, error };
  }
}
