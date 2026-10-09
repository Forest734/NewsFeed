// Reads every feed in sources.js and writes public/news.json, the one file the
// app shows. The Pages workflow runs this every half hour before deploying;
// `npm run fetch` runs it locally.
//
// A feed that fails or comes back empty is skipped with a warning. A category
// with no stories at all fails the run instead, so the workflow stops and the
// site keeps its last good news rather than an empty tab.

import { writeFile } from "node:fs/promises";
import { CATEGORIES } from "./sources.js";
import { mergeStories, parseFeed } from "./feed.js";

const OUT = new URL("../public/news.json", import.meta.url);
const USER_AGENT = "NewsFeed/1.0 (personal news reader; +https://github.com/Forest734/NewsFeed)";

async function readFeed({ url, summaries, only, skip }) {
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/rss+xml, application/atom+xml, application/xml;q=0.9, */*;q=0.8" },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  let stories = parseFeed(await response.text(), response.url);
  if (only) stories = stories.filter((story) => only.test(story.link));
  if (skip) stories = stories.filter((story) => !skip.test(story.title));
  if (summaries === false) for (const story of stories) delete story.summary;
  return stories;
}

const now = Date.now();
let problems = 0;

const categories = await Promise.all(
  CATEGORIES.map(async (category) => {
    const feeds = await Promise.all(
      category.sources.map(async (source) => {
        try {
          const stories = await readFeed(source);
          if (!stories.length) throw new Error("no stories in the feed");
          return { source: source.name, stories };
        } catch (err) {
          problems++;
          console.warn(`  ! ${category.name} / ${source.name}: ${err.cause?.code ?? err.message}`);
          return { source: source.name, stories: [] };
        }
      }),
    );
    const stories = mergeStories(feeds, { now });
    return { id: category.id, name: category.name, sources: category.sources.map((s) => s.name), stories };
  }),
);

for (const { name, stories } of categories) console.log(`${name}: ${stories.length} stories`);

const empty = categories.filter((c) => !c.stories.length).map((c) => c.name);
if (empty.length) {
  console.error(`No stories for ${empty.join(", ")}; not writing news.json.`);
  process.exit(1);
}

await writeFile(OUT, JSON.stringify({ updated: new Date(now).toISOString(), categories }) + "\n");
console.log(`Wrote public/news.json${problems ? ` (${problems} feed${problems > 1 ? "s" : ""} skipped)` : ""}.`);
