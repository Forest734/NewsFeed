// Reads RSS 2.0, RSS 1.0 (RDF) and Atom feeds into plain stories, and merges
// a category's feeds into one list. Pure functions with no I/O, so
// tests/feed.test.js can run them on sample XML.
//
// News feeds are regular enough that a few regular expressions read them;
// a full XML parser would be a dependency for no gain. Everything that comes
// out is plain text or an http(s) URL: tags are stripped here, and the app
// only ever sets it as text, so a feed can't put HTML or script on the page.

const DAY = 24 * 60 * 60 * 1000;

// parseFeed(xml, base) → [{ title, link, time, summary?, image? }], in feed
// order. `time` is ms since 1970; `base` resolves relative links.
export function parseFeed(xml, base) {
  const stories = [];
  for (const [, , block] of xml.matchAll(/<(item|entry)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/g)) {
    const title = text(element(block, "title"));
    const link = webUrl(itemLink(block), base);
    const time = Date.parse(
      text(element(block, "pubDate") ?? element(block, "published") ?? element(block, "dc:date") ?? element(block, "updated")),
    );
    if (!title || !link || Number.isNaN(time)) continue;

    const story = { title, link, time };
    // The first of these with something left after cleanup: some feeds'
    // description is only boilerplate, with the article in content:encoded.
    for (const name of ["description", "summary", "content:encoded", "content"]) {
      const summary = cleanSummary(text(element(block, name)), title);
      if (summary) {
        story.summary = summary;
        break;
      }
    }
    const image = itemImage(block, base);
    if (image) story.image = image;
    stories.push(story);
  }
  return stories;
}

// mergeStories(feeds, options) → one category's list, newest first: each
// source's newest few (so a busy feed can't crowd out a quiet one), nothing
// older than maxAgeDays, no story twice. `feeds` is [{ source, stories }].
// A time in the future (some feeds schedule posts) counts as now.
export function mergeStories(feeds, { now = Date.now(), perSource = 8, maxAgeDays = 7, limit = 60 } = {}) {
  const cutoff = now - maxAgeDays * DAY;
  const seen = new Set();
  const merged = [];
  for (const { source, stories } of feeds) {
    const newest = stories
      .map((story) => ({ ...story, time: Math.min(story.time, now) }))
      .filter((story) => story.time >= cutoff)
      .sort((a, b) => b.time - a.time);
    let taken = 0;
    for (const story of newest) {
      if (taken === perSource) break;
      const titleKey = story.title.toLowerCase().replace(/\W+/g, " ").trim();
      if (seen.has(story.link) || seen.has(titleKey)) continue;
      seen.add(story.link);
      seen.add(titleKey);
      merged.push({ ...story, source });
      taken++;
    }
  }
  return merged
    .sort((a, b) => b.time - a.time)
    .slice(0, limit)
    .map((story) => ({ ...story, time: new Date(story.time).toISOString() }));
}

// The raw contents of the first <name …>…</name> in a block, or null.
function element(block, name) {
  const match = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`));
  return match ? match[1] : null;
}

// An attribute's value from one tag's source, e.g. attr('<link href="x"/>', "href").
function attr(tag, name) {
  const match = tag.match(new RegExp(`\\s${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`));
  return match ? decode(match[2]) : null;
}

// RSS has <link>url</link>; Atom has <link href="url"/>, possibly several,
// where the article is the one with rel="alternate" or no rel at all.
function itemLink(block) {
  const rss = text(element(block, "link"));
  if (rss) return rss;
  for (const [tag] of block.matchAll(/<link(?:\s[^>]*)?>/g)) {
    const rel = attr(tag, "rel");
    if (!rel || rel === "alternate") return attr(tag, "href");
  }
  return null;
}

// The story's picture, from (best first) Media RSS, an image enclosure, or
// the first <img> in its HTML. Only https, so it loads on an https page.
function itemImage(block, base) {
  const media = [];
  for (const [tag] of block.matchAll(/<media:(?:content|thumbnail)(?:\s[^>]*)?>/g)) {
    const type = attr(tag, "type");
    const medium = attr(tag, "medium");
    if ((type && !type.startsWith("image/")) || (medium && medium !== "image")) continue;
    media.push({ url: attr(tag, "url"), width: Number(attr(tag, "width")) || 0 });
  }
  // Big enough for a sharp thumbnail on a phone, but no bigger than needed.
  media.sort((a, b) => a.width - b.width);
  const pick = media.find((m) => m.width >= 300) ?? media.at(-1);

  const enclosure = [...block.matchAll(/<enclosure(?:\s[^>]*)?>/g)]
    .map(([tag]) => tag)
    .find((tag) => attr(tag, "type")?.startsWith("image/"));

  const candidates = [pick?.url, enclosure && attr(enclosure, "url")];
  for (const name of ["content:encoded", "description", "content", "summary"]) {
    const html = unwrap(element(block, name) ?? "");
    for (const [img] of html.matchAll(/<img(?:\s[^>]*)?>/g)) {
      // Skip 1×1 tracking pixels.
      if (attr(img, "width") === "1" || attr(img, "height") === "1") continue;
      candidates.push(attr(img, "src"));
      break;
    }
  }
  for (const url of candidates) {
    const safe = webUrl(url, base);
    if (safe?.startsWith("https:")) return safe;
  }
  return null;
}

// Element contents as markup: CDATA sections are taken as they are, and the
// rest is XML-unescaped, which is how feeds carry HTML either way.
function unwrap(raw) {
  return raw
    .split(/<!\[CDATA\[([\s\S]*?)\]\]>/)
    .map((part, i) => (i % 2 ? part : decode(part)))
    .join("");
}

// Element contents as plain text: unwrapped, tags removed, HTML entities
// decoded, whitespace collapsed.
export function text(raw) {
  if (raw == null) return "";
  const html = unwrap(raw)
    .replace(/<(script|style|figcaption)(?:\s[^>]*)?>[\s\S]*?<\/\1>/gi, " ")
    // Tags that separate blocks of text become a space; inline ones vanish,
    // so "<em>word</em>," stays "word,".
    .replace(/<\/?(?:p|br|div|li|ul|ol|h\d|blockquote|figure|tr|td|table|hr)(?:\s[^>]*)?\/?>/gi, " ")
    .replace(/<[^>]*>/g, "");
  return decode(html).replace(/\s+/g, " ").trim();
}

const NAMED = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", shy: "",
  hellip: "…", mdash: "—", ndash: "–", lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”",
  laquo: "«", raquo: "»", bull: "•", middot: "·", copy: "©", reg: "®", trade: "™",
  deg: "°", times: "×", minus: "−", plusmn: "±", frac12: "½", frac14: "¼", frac34: "¾",
  sup2: "²", sup3: "³", micro: "µ", sect: "§", para: "¶", iexcl: "¡", iquest: "¿",
  cent: "¢", pound: "£", euro: "€", yen: "¥",
  szlig: "ß", aelig: "æ", AElig: "Æ", oslash: "ø", Oslash: "Ø", eth: "ð", ETH: "Ð", thorn: "þ", THORN: "Þ",
};

// Accented letters (&eacute; &Aacute; &ccedil; &ouml; …) are the letter plus
// a combining mark, which covers all of them without listing each one.
const MARKS = { grave: "̀", acute: "́", circ: "̂", tilde: "̃", uml: "̈", ring: "̊", cedil: "̧" };

// Replaces &amp; &#8217; &#x2019; and named entities, in one pass (so
// "&amp;lt;" becomes "&lt;", not "<").
export function decode(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi, (entity, name) => {
    if (name[0] === "#") {
      const code = name[1] === "x" || name[1] === "X" ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : entity;
    }
    if (name in NAMED) return NAMED[name];
    const accent = name.match(/^([A-Za-z])(grave|acute|circ|tilde|uml|ring|cedil)$/);
    return accent ? (accent[1] + MARKS[accent[2]]).normalize("NFC") : entity;
  });
}

// The URL as an absolute http(s) address, or null for anything else
// (javascript:, data:, mailto:, garbage).
function webUrl(url, base) {
  if (!url) return null;
  try {
    const parsed = new URL(url.trim(), base);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.href : null;
  } catch {
    return null;
  }
}

// Drops boilerplate feeds add after the summary, and summaries that only
// repeat the headline, then shortens to about two lines' worth.
function cleanSummary(summary, title) {
  const s = summary
    .replace(/\s*The post .+ appeared first on .+$/i, "")
    .replace(/\s*Continue reading\.*…?$/i, "")
    .replace(/\s*Read more(?: on [^.]*?)?\s*[→»…]?$/i, "")
    .replace(/\s*\[(?:…|\.\.\.)\]$/, "…")
    .replace(/(?:^|\s+)Comments$/, "") // Lobsters' link to its discussion
    .trim();
  if (!s || s === title) return "";
  return shorten(s, 280);
}

function shorten(s, max) {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const space = cut.lastIndexOf(" ");
  return cut.slice(0, space > max * 0.6 ? space : max).replace(/[\s,;:.–—-]+$/, "") + "…";
}
