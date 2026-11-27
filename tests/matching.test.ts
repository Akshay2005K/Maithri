import "./setupEnv";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  doesInterestedInIncludeGender,
  computeCompatibilityScore,
  computeCompatibilityBreakdown,
  getMatchDate,
} from "../src/lib/matching";
import { isOwnedMediaPath } from "../src/lib/profileMediaServer";

it("changes the match date at midnight in India", () => {
  assert.equal(getMatchDate(new Date("2026-11-27T18:29:59Z")), "2026-11-27");
  assert.equal(getMatchDate(new Date("2026-11-27T18:30:00Z")), "2026-11-28");
});

it("accepts legacy and new media filenames only under the intended owner's folder", () => {
  const owner = "example-owner";
  assert.equal(isOwnedMediaPath(`${owner}/photo-1795800000000-blur1.webp`, owner), true);
  assert.equal(isOwnedMediaPath(`${owner}/voice-8defeb67-d50c-4539-aef5-de670c948c45.webm`, owner), true);
  assert.equal(isOwnedMediaPath("other-owner/photo-1795800000000-full.webp", owner), false);
  assert.equal(isOwnedMediaPath(`${owner}/../photo-1795800000000-full.webp`, owner), false);
});

function makeProfile(overrides: Record<string, unknown> = {}) {
  return {
    id: "u1",
    full_name: "Test User",
    age: 25,
    birth_date: "2001-05-10",
    gender: "man",
    looking_for: "women",
    city: "Bengaluru",
    role_title: "Engineer",
    company_domain: "example.com",
    college_name: "NIT Trichy",
    batch: 2022,
    hide_same_company: true,
    hide_same_college: false,
    bio_prompt: null,
    avatar_url: "/avatars/avatar-1.svg",
    relationship_goal: "long_term" as const,
    prompts: [],
    details: { interests: ["Filter coffee", "Reading"] },
    q1: 4,
    q2: 3,
    q3: 4,
    q4: 5,
    q5: 4,
    dpdp_consent_at: "2026-01-01T00:00:00Z",
    plan: "free" as const,
    ...overrides,
  };
}

describe("doesInterestedInIncludeGender", () => {
  it("matches standard and beyond_binary/everyone combinations", () => {
    assert.equal(doesInterestedInIncludeGender("women", "woman"), true);
    assert.equal(doesInterestedInIncludeGender("women", "man"), false);
    assert.equal(doesInterestedInIncludeGender("men", "man"), true);
    assert.equal(
      doesInterestedInIncludeGender("beyond_binary", "beyond_binary"),
      true
    );
    assert.equal(doesInterestedInIncludeGender("everyone", "man"), true);
    assert.equal(doesInterestedInIncludeGender("everyone", "woman"), true);
    assert.equal(
      doesInterestedInIncludeGender("everyone", "beyond_binary"),
      true
    );
  });
});

describe("computeCompatibilityScore", () => {
  it("returns 100 for identical quiz answers and 0 for maximally opposite answers", () => {
    const a = makeProfile({ q1: 1, q2: 1, q3: 1, q4: 1, q5: 1 });
    const bSame = makeProfile({ id: "u2", q1: 1, q2: 1, q3: 1, q4: 1, q5: 1 });
    const bOpp = makeProfile({ id: "u3", q1: 5, q2: 5, q3: 5, q4: 5, q5: 5 });

    assert.equal(computeCompatibilityScore(a, bSame), 100);
    assert.equal(computeCompatibilityScore(a, bOpp), 0);
  });
});

describe("computeCompatibilityBreakdown", () => {
  it("computes shared interests, city label, goal summary, and 5 factor scores", () => {
    const a = makeProfile({
      city: "Bengaluru",
      relationship_goal: "long_term",
      details: { interests: ["Filter coffee", "Reading", "Cycling"] },
    });
    const b = makeProfile({
      id: "u2",
      city: "Bengaluru",
      relationship_goal: "open",
      details: { interests: ["Reading", "Art"] },
      q1: 4,
      q2: 3,
      q3: 4,
      q4: 5,
      q5: 4,
    });

    const breakdown = computeCompatibilityBreakdown(a, b);
    assert.deepEqual(breakdown.sharedInterests, ["Reading"]);
    assert.equal(breakdown.cityLabel, "Same city (Bengaluru)");
    assert.equal(breakdown.goalSummary, "Compatible relationship goals");
    assert.equal(breakdown.factors.length, 5);
    assert.equal(breakdown.factors[0].score, 100);
  });
});
