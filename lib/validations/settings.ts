import { z } from "zod";
import { LIMITS } from "@/lib/constants";

export const settingsSchema = z.object({
  accountSize: z
    .number()
    .min(LIMITS.MIN_ACCOUNT_SIZE, `Minimum account size is $${LIMITS.MIN_ACCOUNT_SIZE}`)
    .max(LIMITS.MAX_ACCOUNT_SIZE, `Maximum account size is $${LIMITS.MAX_ACCOUNT_SIZE.toLocaleString()}`),
  riskPerTrade: z
    .number()
    .min(LIMITS.MIN_RISK_PER_TRADE, `Minimum risk is ${LIMITS.MIN_RISK_PER_TRADE}%`)
    .max(LIMITS.MAX_RISK_PER_TRADE, `Maximum risk is ${LIMITS.MAX_RISK_PER_TRADE}%`),
  defaultStrategy: z.string().min(1, "Please select a strategy"),
  emailAlerts: z.boolean(),
});

export type SettingsFormData = z.infer<typeof settingsSchema>;
