import { test } from "node:test";
import assert from "node:assert/strict";
import { decode, mergeStories, parseFeed, text } from "../scripts/feed.js";

const rss = `<?xml version="1.0"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/" xmlns:content="http://purl.org/rss/1.0/modules/content/">
<channel>
  <title>Example</title>
  <link>https://example.org/</link>
  <item>
    <title><![CDATA[Rivers & <em>lakes</em> rise]]></title>
    <link>https://example.org/rivers</link>
    <pubDate>Tue, 06 Oct 2026 09:00:00 -0400</pubDate>
    <description>&lt;p&gt;Water is &lt;b&gt;up&lt;/b&gt;, says the &amp;quot;agency&amp;quot;.&lt;/p&gt;&lt;p&gt;More soon.&lt;/p&gt;</description>
    <media:content url="https://img.example.org/small.jpg" width="140" medium="image"/>
    <media:content url="https://img.example.org/large.jpg" width="460" medium="image"/>
  </item>
  <item>
    <title>Second story</title>
    <link>/second</link>
    <pubDate>Mon, 05 Oct 2026 12:00:00 GMT</pubDate>
    <description><![CDATA[<p>The post <a href="https://example.org/second">Second story</a> appeared first on <a href="https://example.org">Example</a>.</p>]]></description>
    <content:encoded><![CDATA[<figure><img src="https://example.org/pixel.gif" width="1" height="1"><img src="https://example.org/photo.jpg"></figure><p>The full article text.</p>]]></content:encoded>
  </item>
  <item>
    <title>No date</title>
    <link>https://example.org/undated</link>
  </item>
  <item>
    <title>Bad link</title>
    <link>javascript:alert(1)</link>
    <pubDate>Mon, 05 Oct 2026 12:00:00 GMT</pubDate>
  </item>
</channel>
</rss>`;

test("parseFeed reads RSS 2.0: text, links, dates, summaries, pictures", () => {
  const stories = parseFeed(rss, "https://example.org/feed");
  assert.equal(stories.length, 2, "undated and javascript: items are dropped");

  const [first, second] = stories;
  assert.equal(first.title, "Rivers & lakes rise");
  assert.equal(first.link, "https://example.org/rivers");
  assert.equal(first.time, Date.parse("2026-10-06T13:00:00Z"));
  assert.equal(first.summary, 'Water is up, says the "agency". More soon.');
  assert.equal(first.image, "https://img.example.org/large.jpg", "the smallest picture at least 300 wide");

  assert.equal(second.link, "https://example.org/second", "relative links resolve against the feed");
  assert.equal(second.summary, "The full article text.", "boilerplate description falls back to the article");
  assert.equal(second.image, "https://example.org/photo.jpg", "tracking pixel skipped");
});

test("parseFeed reads Atom", () => {
  const atom = `<feed xmlns="http://www.w3.org/2005/Atom">
    <entry>
      <title type="html">Models &amp;amp; agents</title>
      <link rel="replies" href="https://example.org/a#comments"/>
      <link href="https://example.org/a"/>
      <published>2026-10-05T23:56:47+00:00</published>
      <updated>2026-10-06T08:00:00+00:00</updated>
      <summary type="html">&lt;p&gt;A short note.&lt;/p&gt;</summary>
    </entry>
  </feed>`;
  assert.deepEqual(parseFeed(atom, "https://example.org/atom"), [
    {
      title: "Models & agents",
      link: "https://example.org/a",
      time: Date.parse("2026-10-05T23:56:47Z"),
      summary: "A short note.",
    },
  ]);
});

test("parseFeed reads RSS 1.0 (RDF) with dc:date, and image enclosures", () => {
  const rdf = `<rdf:RDF><channel><items><rdf:Seq><rdf:li resource="https://example.org/r"/></rdf:Seq></items></channel>
    <item rdf:about="https://example.org/r">
      <title>RDF story</title>
      <link>https://example.org/r</link>
      <dc:date>2026-10-06T15:11:42Z</dc:date>
      <enclosure url="http://example.org/insecure.jpg" type="image/jpeg"/>
    </item></rdf:RDF>`;
  const [story] = parseFeed(rdf, "https://example.org/rdf");
  assert.equal(story.title, "RDF story");
  assert.equal(story.time, Date.parse("2026-10-06T15:11:42Z"));
  assert.equal(story.image, undefined, "http pictures are left out (they wouldn't load on an https page)");
});

test("decode handles numeric, named and accented entities in one pass", () => {
  assert.equal(decode("it&#039;s &#x2019; &mdash; &Aacute;brego &ccedil;a &amp;lt;"), "it's ’ — Ábrego ça &lt;");
  assert.equal(decode("&bogus; &#0;"), "&bogus; &#0;");
});

test("text strips tags and keeps words apart only at block breaks", () => {
  assert.equal(text("<![CDATA[<p>One <em>two</em>,</p><p>three<br/>four</p><script>x()</script>]]>"), "One two, three four");
  assert.equal(text(null), "");
});

test("long summaries are shortened at a word", () => {
  const long = "word ".repeat(100);
  const [story] = parseFeed(
    `<item><title>T</title><link>https://e.org/t</link><pubDate>Tue, 06 Oct 2026 09:00:00 GMT</pubDate><description>${long}</description></item>`,
    "https://e.org/",
  );
  assert.ok(story.summary.length <= 281);
  assert.match(story.summary, /word…$/);
});

test("Lobsters' link to its comments isn't a summary", () => {
  const item = (n, description) =>
    `<item><title>T${n}</title><link>https://e.org/${n}</link><pubDate>Tue, 06 Oct 2026 09:00:00 GMT</pubDate><description>${description}</description></item>`;
  const comments = '&lt;p&gt;&lt;a href="https://lobste.rs/s/x/y"&gt;Comments&lt;/a&gt;&lt;/p&gt;';
  const stories = parseFeed(item(1, comments) + item(2, `&lt;p&gt;We study agents.&lt;/p&gt;\n${comments}`), "https://e.org/");
  assert.deepEqual(stories.map((s) => s.summary), [undefined, "We study agents."]);
});

test("GitHub releases: no heading in the summary, no avatar as the picture", () => {
  const [release] = parseFeed(
    `<feed xmlns="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/"><entry>
      <updated>2026-10-09T19:28:59Z</updated>
      <link rel="alternate" type="text/html" href="https://github.com/o/r/releases/tag/v2.1.0"/>
      <title>v2.1.0</title>
      <content type="html">&lt;h2&gt;What&#39;s changed&lt;/h2&gt;
&lt;ul&gt;&lt;li&gt;Added &lt;code&gt;--agents&lt;/code&gt;&lt;/li&gt;&lt;/ul&gt;</content>
      <media:thumbnail height="30" width="30" url="https://avatars.githubusercontent.com/u/1?s=60&amp;v=4"/>
    </entry></feed>`,
    "https://github.com/o/r/releases.atom",
  );
  assert.equal(release.summary, "Added --agents");
  assert.equal(release.image, undefined);
});

const NOW = Date.parse("2026-10-06T16:00:00Z");
const HOUR = 60 * 60 * 1000;
const story = (n, hoursAgo, extra = {}) => ({ title: `Story ${n}`, link: `https://e.org/${n}`, time: NOW - hoursAgo * HOUR, ...extra });

test("mergeStories: newest first, a few per source, no repeats, nothing stale", () => {
  const busy = { source: "Busy", stories: Array.from({ length: 20 }, (_, i) => story(`b${i}`, i + 1)) };
  const quiet = {
    source: "Quiet",
    stories: [
      story("q1", 30),
      story("q-old", 24 * 8),
      story("b0-copy", 2, { title: "Story b0" }),
      story("future", -3),
    ],
  };
  const merged = mergeStories([busy, quiet], { now: NOW, perSource: 3 });

  assert.deepEqual(
    merged.map((s) => [s.source, s.title]),
    [
      ["Quiet", "Story future"],
      ["Busy", "Story b0"],
      ["Busy", "Story b1"],
      ["Busy", "Story b2"],
      ["Quiet", "Story q1"],
    ],
  );
  assert.equal(merged[0].time, new Date(NOW).toISOString(), "future times count as now");
});

test("mergeStories caps the whole list", () => {
  const feed = { source: "A", stories: Array.from({ length: 10 }, (_, i) => story(i, i)) };
  assert.equal(mergeStories([feed], { now: NOW, perSource: 10, limit: 4 }).length, 4);
});
