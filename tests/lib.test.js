import { test } from "node:test";
import assert from "node:assert/strict";
import { pickCategory, timeAgo } from "../public/lib.js";

test("timeAgo", () => {
  const now = Date.parse("2026-10-06T16:00:00Z");
  const ago = (ms) => timeAgo(new Date(now - ms).toISOString(), now);
  assert.equal(ago(30_000), "just now");
  assert.equal(ago(-60_000), "just now", "a clock slightly behind the server");
  assert.equal(ago(5 * 60_000), "5m ago");
  assert.equal(ago(59 * 60_000), "59m ago");
  assert.equal(ago(3 * 3600_000 + 59 * 60_000), "3h ago");
  assert.equal(ago(49 * 3600_000), "2d ago");
  assert.equal(timeAgo("not a date", now), "just now");
});

test("pickCategory", () => {
  const categories = [{ id: "us" }, { id: "world" }, { id: "coding-ai" }];
  assert.equal(pickCategory(categories, "#world").id, "world");
  assert.equal(pickCategory(categories, "#coding-ai").id, "coding-ai");
  assert.equal(pickCategory(categories, "").id, "us");
  assert.equal(pickCategory(categories, "#nope").id, "us");
});
