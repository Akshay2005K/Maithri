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
    description: "Up to 5 daily matches and text chat only.",
    monthlyPriceInr: 0,
    features: [
      "Up to 5 curated matches",
      "Unlimited messaging",
    ],
  },
  {
    id: "plus",
    name: "Plus",
    description: "Up to 7 daily matches, text chat, and voice calls.",
    monthlyPriceInr: 199,
    features: [
      "Up to 7 curated daily matches",
      "Text messaging (4+ words)",
      "Voice calls (unlocked at unblur Level 2+)",
      "Match reasons: see why you matched",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    description: "Up to 10 daily matches, text chat, voice calls, and video calls.",
    monthlyPriceInr: 349,
    features: [
      "Up to 10 curated daily matches",
      "Text messaging (4+ words)",
      "Voice calls (unlocked at unblur Level 2+)",
      "Video calls (unlocked at unblur Level 3)",
      "Match reasons: see why you matched",
    ],
  },
];
