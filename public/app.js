// The app: loads news.json (written every half hour by scripts/fetch-news.js),
// shows one category at a time as a list of stories, and opens a story's
// own page when it's tapped. The tab is the location hash (#world), so the
// back button and bookmarks work.
//
// Feed text is only ever set with textContent, never as HTML.

import { pickCategory, timeAgo } from "./lib.js";

// Coming back to the app after this long fetches the news again.
const STALE = 10 * 60_000;

const tabs = document.getElementById("tabs");
const list = document.getElementById("stories");
const status = document.getElementById("status");
const sources = document.getElementById("sources");
const refresh = document.getElementById("refresh");
const today = document.getElementById("today");

let news = null;
let loadedAt = 0;

async function load() {
  refresh.disabled = true;
  refresh.classList.add("busy");
  try {
    const response = await fetch("news.json", { cache: "no-cache" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    news = await response.json();
    loadedAt = Date.now();
    renderTabs();
    renderStories();
  } catch (err) {
    console.error(err);
    status.textContent = news ? "Couldn't refresh. Showing the news from before." : "Couldn't load the news. Check your connection and tap ↻.";
  } finally {
    refresh.disabled = false;
    refresh.classList.remove("busy");
  }
}

function renderTabs() {
  tabs.replaceChildren(
    ...news.categories.map((category) => {
      const a = document.createElement("a");
      a.href = `#${category.id}`;
      a.textContent = category.name;
      return a;
    }),
  );
}

function renderStories() {
  const category = pickCategory(news.categories, location.hash);
  document.title = `${category.name} · NewsFeed`;
  for (const a of tabs.children) {
    if (a.hash === `#${category.id}`) {
      a.setAttribute("aria-current", "page");
      a.scrollIntoView({ block: "nearest", inline: "nearest" });
    } else {
      a.removeAttribute("aria-current");
    }
  }

  const now = Date.now();
  today.textContent = new Date(now).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  status.textContent = `Updated ${timeAgo(news.updated, now)}`;
  list.replaceChildren(...category.stories.map((story) => storyItem(story, now)));
  sources.textContent = `From ${category.sources.join(", ")}.`;
}

function storyItem(story, now) {
  const a = document.createElement("a");
  a.className = "story";
  a.href = story.link;
  a.target = "_blank";
  a.rel = "noopener noreferrer";

  const body = document.createElement("div");
  body.className = "story-body";

  const meta = document.createElement("p");
  meta.className = "meta";
  const source = document.createElement("span");
  source.className = "source";
  source.textContent = story.source;
  const time = document.createElement("time");
  time.dateTime = story.time;
  time.textContent = timeAgo(story.time, now);
  meta.append(source, " · ", time);

  const title = document.createElement("h2");
  title.textContent = story.title;
  body.append(meta, title);

  if (story.summary) {
    const summary = document.createElement("p");
    summary.className = "summary";
    summary.textContent = story.summary;
    body.append(summary);
  }
  a.append(body);

  if (story.image) {
    const img = document.createElement("img");
    img.className = "thumb";
    img.src = story.image;
    img.alt = "";
    img.loading = "lazy";
    img.decoding = "async";
    // Don't tell the news site which app or page asked for the picture.
    img.referrerPolicy = "no-referrer";
    img.addEventListener("error", () => img.remove());
    a.append(img);
  }

  const li = document.createElement("li");
  li.append(a);
  return li;
}

addEventListener("hashchange", () => {
  if (!news) return;
  renderStories();
  scrollTo(0, 0);
});

refresh.addEventListener("click", async () => {
  await load();
  scrollTo(0, 0);
});

// Back from reading a story: fetch again if it's been a while, but only when
// at the top of the list, so the list doesn't shift under a reader halfway down.
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && Date.now() - loadedAt > STALE && scrollY < 50) load();
});

if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js");

load();
