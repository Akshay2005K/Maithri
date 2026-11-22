import type { PlanTier } from "./entitlements";

export interface PlanConfig {
  id: PlanTier;
  name: string;
  description: string;
  monthlyPriceInr: number;
  features: string[];
}

export const PLANS: PlanConfig[] = [
  {
    id: "free",
    name: "Free",
    description: "Curated daily matches and thoughtful text chat.",
    monthlyPriceInr: 0,
    features: [],
  },
  {
    id: "plus",
    name: "Plus",
    description: "Extra daily match capacity and voice calling.",
    monthlyPriceInr: 199,
    features: [],
  },
  {
    id: "pro",
    name: "Pro",
    description: "Full access with voice and video calling.",
    monthlyPriceInr: 349,
    features: [],
  },
];
