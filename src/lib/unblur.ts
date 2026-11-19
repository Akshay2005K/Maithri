// Progressive photo unblur logic.
// Honest note: CSS blur hides the image visually only; the image URL is still in the page source.
// Production would serve pre-blurred images and swap the source server-side.

export interface BasicMessage {
  sender_id: string;
  content: string;
}

export interface UnblurStatus {
  level: 1 | 2 | 3;
  blurClass: "blur-xl" | "blur-md" | "blur-none";
  label: string;
  validCount: number;
  bothHaveWritten: boolean;
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function getUnblurStatus(messages: BasicMessage[]): UnblurStatus {
  // A message counts only if it has 4 or more words
  const validMessages = messages.filter((m) => countWords(m.content) >= 4);
  const validCount = validMessages.length;
  const distinctSenders = new Set(validMessages.map((m) => m.sender_id));
  const bothHaveWritten = distinctSenders.size >= 2;

  if (!bothHaveWritten) {
    return {
      level: 1,
      blurClass: "blur-xl",
      label: "Level 1 (Blurred — waiting for both people to write 4+ words)",
      validCount,
      bothHaveWritten,
    };
  }

  if (validCount < 3) {
    return {
      level: 2,
      blurClass: "blur-md",
      label: `Level 2 (Partially unblurred — ${validCount}/3 valid messages)`,
      validCount,
      bothHaveWritten,
    };
  }

  return {
    level: 3,
    blurClass: "blur-none",
    label: "Level 3 (Unblurred — 3+ valid messages from both sides)",
    validCount,
    bothHaveWritten,
  };
}
