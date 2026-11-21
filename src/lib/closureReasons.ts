export type ClosureReasonKey =
  | "not_a_fit"
  | "no_connection"
  | "taking_a_break"
  | "different_goals";

export const CLOSURE_REASONS: {
  key: ClosureReasonKey;
  message: string;
}[] = [
  {
    key: "not_a_fit",
    message:
      "Thanks for chatting. I don't think we're a fit, and I wish you well.",
  },
  {
    key: "no_connection",
    message: "I've enjoyed talking, but I don't feel a connection.",
  },
  {
    key: "taking_a_break",
    message:
      "I'm taking a break from dating. Thank you for the conversation.",
  },
  {
    key: "different_goals",
    message: "Our goals seem different. I wish you all the best.",
  },
];

export const VALID_CLOSURE_REASON_KEYS = new Set<string>(
  CLOSURE_REASONS.map((r) => r.key)
);

export function getClosureReasonMessage(
  key: string | null | undefined
): string | null {
  if (!key) return null;
  return CLOSURE_REASONS.find((r) => r.key === key)?.message ?? null;
}
