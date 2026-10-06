import { test } from "node:test";
import assert from "node:assert/strict";
import { CATEGORIES } from "../scripts/sources.js";

test("categories have unique ids that work in a URL hash", () => {
  const ids = CATEGORIES.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.match(id, /^[a-z0-9-]+$/);
});

test("every source has a name and an https feed, once per category", () => {
  for (const { name, sources } of CATEGORIES) {
    assert.ok(sources.length, `${name} has sources`);
    const urls = sources.map((s) => s.url);
    assert.equal(new Set(urls).size, urls.length, `${name} lists a feed twice`);
    for (const source of sources) {
      assert.ok(source.name, `${name}: a source has no name`);
      assert.equal(new URL(source.url).protocol, "https:", `${name} / ${source.name}`);
    }
  }
});
