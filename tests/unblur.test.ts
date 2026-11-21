import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { countWords, getUnblurStatus } from "../src/lib/unblur";

describe("countWords", () => {
  it("counts words separated by whitespace", () => {
    assert.equal(countWords("hello"), 1);
    assert.equal(countWords("  hi   there friend  "), 3);
    assert.equal(countWords("This is four words"), 4);
    assert.equal(countWords("   "), 0);
  });
});

describe("getUnblurStatus", () => {
  it("stays at Level 1 when only one person has written valid 4+ word messages", () => {
    const status = getUnblurStatus([
      { sender_id: "u1", content: "Hey, how was your Sunday morning?" },
      { sender_id: "u1", content: "I also love filter coffee in Bengaluru." },
      { sender_id: "u2", content: "Hey!" }, // < 4 words, ignored
    ]);
    assert.equal(status.level, 1);
    assert.equal(status.blurClass, "blur-xl");
    assert.equal(status.bothHaveWritten, false);
    assert.equal(status.validCount, 2);
  });

  it("advances to Level 2 when both people have written 1 valid message each (2 total)", () => {
    const status = getUnblurStatus([
      { sender_id: "u1", content: "Hey, how was your Sunday morning?" },
      { sender_id: "u2", content: "It was great, went for a run!" },
    ]);
    assert.equal(status.level, 2);
    assert.equal(status.blurClass, "blur-md");
    assert.equal(status.bothHaveWritten, true);
    assert.equal(status.validCount, 2);
  });

  it("advances to Level 3 when both have written and at least 3 valid messages exist", () => {
    const status = getUnblurStatus([
      { sender_id: "u1", content: "Hey, how was your Sunday morning?" },
      { sender_id: "u2", content: "It was great, went for a run!" },
      { sender_id: "u1", content: "Nice! Which park did you run in?" },
    ]);
    assert.equal(status.level, 3);
    assert.equal(status.blurClass, "blur-none");
    assert.equal(status.validCount, 3);
  });
});
