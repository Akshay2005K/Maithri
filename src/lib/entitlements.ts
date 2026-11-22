export type PlanTier = "free" | "plus" | "pro";

export interface PlanEntitlements {
  dailyMatches: number;
  voiceCall: boolean;
  videoCall: boolean;
  matchReasons: boolean;
}

export const PLAN_ENTITLEMENTS: Record<PlanTier, PlanEntitlements> = {
  free: { dailyMatches: 5, voiceCall: false, videoCall: false, matchReasons: false },
  plus: { dailyMatches: 7, voiceCall: true, videoCall: false, matchReasons: true },
  pro: { dailyMatches: 10, voiceCall: true, videoCall: true, matchReasons: true },
};

export function normalizePlan(plan?: string | null): PlanTier {
  if (plan === "plus" || plan === "pro") return plan;
  return "free";
}

export function getEntitlements(plan?: string | null): PlanEntitlements {
  return PLAN_ENTITLEMENTS[normalizePlan(plan)];
}

export function getRequiredPlanForCall(
  callType: "audio" | "video"
): "plus" | "pro" {
  return callType === "video" ? "pro" : "plus";
}

export function canStartCall(
  plan: string | null | undefined,
  callType: "audio" | "video"
): boolean {
  const ent = getEntitlements(plan);
  return callType === "video" ? ent.videoCall : ent.voiceCall;
}
