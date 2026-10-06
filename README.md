# NewsFeed

Ad-free news on your phone, from free sources only, in five sections:
**U.S.**, **World**, **Environment**, **Science** and **Coding & AI**.

The app has no ads, no trackers, no accounts and no API keys. It's a page of
headlines with a short summary and a picture. Tap a story to read it on the
source's own site. Every source is free to read with no paywall or
subscription. Most are public media or nonprofit newsrooms whose sites have
no ads either. A few (BBC, The Guardian, Al Jazeera, Ars Technica) are free
but show ads on their own pages; they're marked in `scripts/sources.js`, and
each can be removed by deleting its line.

## Sources

| Section | Sources |
|---|---|
| U.S. | NPR, PBS NewsHour, ProPublica, The 19th, Stateline |
| World | BBC News, NPR, PBS NewsHour, The Guardian, Al Jazeera, DW, UN News |
| Environment | Inside Climate News, Grist, Yale Environment 360, Mongabay, Carbon Brief, NPR, The Guardian |
| Science | NASA, Quanta Magazine, Science News, NPR, Knowable Magazine, Ars Technica |
| Coding & AI | Ars Technica, Simon Willison, GitHub Blog, Hugging Face, Stack Overflow Blog, Hacker News |

Each section shows up to 8 of each source's newest stories from the past
week, newest first, so a source that posts constantly can't bury the others.
A source with nothing new that week (Knowable posts every week or two) just
doesn't appear until it does. Hacker News stories link to wherever was
posted, which is occasionally a paywalled site.

To add or remove a source, edit `scripts/sources.js` (any RSS or Atom feed
works), then run `npm run fetch` to check it.

## Using it on your phone

Open the site and add it to the home screen. On Android in Chrome it's
**⋮ → Add to Home screen** (or **Install app**); on an iPhone in Safari it's
**Share → Add to Home Screen**. It then opens like an app.

- The news updates every half hour. The line under the tabs says when.
  Tap **↻** to check for newer news, and coming back to the app after
  10 minutes checks by itself.
- With no signal, it opens with the last news it loaded. Stories need a
  connection to open.
- Stories you've opened turn grey.

## How it works

News sites publish their headlines as RSS or Atom feeds, which are free and
need no key. A browser page isn't allowed to read another site's feed
directly (browsers block that, a rule called CORS), so the reading happens on
GitHub's computers instead:

1. Every half hour, GitHub Actions (`.github/workflows/pages.yml`) runs
   `scripts/fetch-news.js`. It downloads every feed in `scripts/sources.js`,
   strips them down to plain text (title, link, time, a ~280-character
   summary, a picture), and writes it all to `public/news.json`.
2. The workflow then publishes `public/` to GitHub Pages: the app's files plus
   that fresh `news.json`.
3. The app (`public/app.js`) loads `news.json` and draws the tabs and stories.
   A service worker (`public/sw.js`) keeps a copy of the app and the last news
   for offline use.

If a run goes wrong (a test fails, or a whole section comes back empty),
nothing is published and the site keeps the last good news. A single feed
that's down is skipped with a warning in the run's log.

GitHub Pages and Actions are free for public repositories.

## Deploying to GitHub Pages

1. Create an empty **public** repository named `NewsFeed` on GitHub (no README,
   no license, so it doesn't clash with this one).
2. Push this repo to it.
3. In the repo on GitHub: **Settings → Pages → Build and deployment → Source:
   GitHub Actions**.
4. **Actions → Pages → Run workflow** to publish the first time. The site is
   then at `https://forest734.github.io/NewsFeed/` and updates itself.

GitHub turns off timed workflows in a public repo after 60 days with no new
commits, and emails you when it does. If the "Updated" line starts saying
days ago, go to **Actions → Pages** and click **Enable workflow**, or push
any commit.

## Running it on your computer

Needs Node 20 or newer and Python 3.

```sh
npm run fetch    # download the news into public/news.json
npm run dev      # http://localhost:8000 (another port: python3 scripts/serve.py 8001)
npm test         # the tests
```
