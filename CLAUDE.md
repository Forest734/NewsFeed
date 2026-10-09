# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

NewsFeed is an ad-free phone news reader: nine fixed sections (U.S., World, Environment,
Science, Coding & AI, Claude Code, Vibe Coding, Open Source, GIS) built from free RSS/Atom
feeds. A static, no-build vanilla-JS PWA in `public/`, deployed to GitHub Pages by a workflow
that also fetches the news every half hour.
There is no server and no API key. README.md covers the sources, deploy steps and limits.

## Commands

```sh
npm run fetch                      # all feeds → public/news.json (gitignored), ~5 s
npm run dev                        # http://localhost:8000 (scripts/serve.py: public/, Cache-Control: no-cache)
npm test                           # node:test, all files in tests/
node --test tests/feed.test.js     # one file
```

No dependencies, linter or build. `node --check public/*.js` catches syntax errors. The app
needs a `public/news.json` to show anything, so run `npm run fetch` before `npm run dev`.
Screenshots and interactions: headless Chrome over CDP as in Phishbase's CLAUDE.md;
`Emulation.setDeviceMetricsOverride` for a 390px phone (headless windows are ≥500px wide),
`Emulation.setEmulatedMedia` with `prefers-color-scheme` for dark mode. Story pictures load
from the news sites, so screenshots need the network.

## Architecture

**Data pipeline** (Node, runs in Actions and locally; never in the browser):

- `scripts/sources.js`: `CATEGORIES`, the tabs in order, each `{ id, name, sources }`; a
  source is `{ name, url, summaries?, only?, skip? }`. `id` is the URL hash (`#coding-ai`).
  `summaries: false` drops descriptions that aren't summaries (Hacker News); `only` is a
  RegExp a story's link must match, for feeds that mix in other sections (both Guardian feeds
  carry its front page); `skip` is a RegExp a story's title must not match (LWN's
  subscriber-only `[$]` stories). Sites with ads on their own pages are commented `// ads`.
  Reddit was tried for Vibe Coding and dropped: its feeds answer HTTP 429 after a few
  requests.
- `scripts/feed.js`: pure. `parseFeed(xml, base)` reads RSS 2.0, RSS 1.0/RDF and Atom with
  regexes (no XML parser on purpose) into `{ title, link, time (ms), summary?, image? }`.
  Everything leaving it is plain text or an http(s) URL; pictures must be https. Summary is
  the first of description/summary/content:encoded/content that survives `cleanSummary`
  (WordPress "The post … appeared first on", "Continue reading", "Read more on …", Lobsters'
  trailing "Comments" link, GitHub releases' "What's changed" heading), cut to ~280 chars.
  Picture: Media RSS (smallest ≥300 wide, else largest; one declared <100 wide is an icon,
  like GitHub's avatars, and skipped), image enclosure, then the first non-1×1 `<img>`.
  `decode` handles numeric entities, a named table, and accented letters as letter +
  combining mark + NFC. `mergeStories` caps each source at 8, drops
  >7 days old, clamps future times to now, dedupes by link and by normalised title, sorts
  newest first, caps at 60, and turns times into ISO strings.
- `scripts/fetch-news.js`: fetches all feeds in parallel (20 s timeout, identifying
  User-Agent), writes `public/news.json` as
  `{ updated, categories: [{ id, name, sources: [names], stories }] }`. A failed or empty
  feed is a warning; an empty category exits 1 without writing, so the workflow deploys
  nothing and Pages keeps the last good news.

**App** (`public/`, native ES modules, relative paths because Pages serves from
`/NewsFeed/`):

- `app.js`: loads `news.json` (`cache: "no-cache"`), renders tabs and the current category's
  stories. Feed text is set only with `textContent`. Stories open in a new tab with
  `noopener noreferrer`; pictures are lazy, `referrerpolicy=no-referrer`, removed on error.
  Reloads on ↻, and on returning to the page after 10 minutes, but only when scrolled near
  the top (so the list doesn't shift under a reader).
- `lib.js`: pure helpers (`timeAgo`, `pickCategory`), tested under Node.
- `sw.js`: precaches the app files and `news.json` on install (best effort), then
  network-first with `cache: "no-cache"` for same-origin GETs, falling back to the cache
  offline. Bump `CACHE` only to drop old caches; new versions show up without it.

**Deploy:** `.github/workflows/pages.yml` runs on push to main, by hand, and on cron
`7,37 * * * *`: `npm test`, `npm run fetch`, upload `public/`, deploy. Pages source must be
"GitHub Actions". `news.json` is never committed. GitHub disables the schedule after 60 days
without commits to a public repo (README tells the user how to re-enable).

## Conventions

- Keep it dependency-free and build-free, like the user's other no-build front ends
  (MusicStream).
- Adding a source is a one-line change in `sources.js`; check it with `npm run fetch` and by
  looking at its stories in `public/news.json` (summary boilerplate, pictures, mixed-in
  sections).
- CHANGELOG.md follows Keep a Changelog; add user-facing changes under [Unreleased].
