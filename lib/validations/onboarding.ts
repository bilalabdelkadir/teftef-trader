import { z } from "zod";
import { LIMITS } from "@/lib/constants";

export const onboardingSchema = z.object({
  markets: z.array(z.string()).min(1, "Please select at least one market"),
  assets: z.array(z.string()).min(1, "Please select at least one asset"),
  strategy: z.string().min(1, "Please select a strategy"),
  accountSize: z
    .number()
    .min(LIMITS.MIN_ACCOUNT_SIZE, `Minimum account size is $${LIMITS.MIN_ACCOUNT_SIZE}`)
    .positive("Account size must be positive"),
  riskPerTrade: z
    .number()
    .min(LIMITS.MIN_RISK_PER_TRADE, `Minimum risk is ${LIMITS.MIN_RISK_PER_TRADE}%`)
    .max(LIMITS.MAX_RISK_PER_TRADE, `Maximum risk is ${LIMITS.MAX_RISK_PER_TRADE}%`),
});

export type OnboardingFormData = z.infer<typeof onboardingSchema>;
