// The app's tabs, in order, and the feeds behind each one. Every feed is free:
// no subscription, account or API key. Mostly public media and nonprofit
// newsrooms; the rest are free to read but carry ads on their own sites
// (marked "ads" below). To add a source, add a line with its RSS or Atom feed
// URL and run `npm run fetch` to check it.
//
// `summaries: false` drops a feed's descriptions when they aren't one (Hacker
// News's is just a "Comments" link). `only` keeps just the stories whose link
// matches it, for feeds that mix in other sections (the Guardian's world and
// environment feeds carry its front page too: UK politics, US news, opinion).
// `skip` drops the stories whose title matches it (LWN's "[$]" stories are
// for subscribers only in their first week; its daily "Security updates for
// …" post is a list of distro patches).

export const CATEGORIES = [
  {
    id: "us",
    name: "U.S.",
    sources: [
      { name: "NPR", url: "https://feeds.npr.org/1003/rss.xml" },
      { name: "PBS NewsHour", url: "https://www.pbs.org/newshour/feeds/rss/nation" },
      { name: "ProPublica", url: "https://www.propublica.org/feeds/propublica/main" },
      { name: "The 19th", url: "https://19thnews.org/feed/" },
      { name: "Stateline", url: "https://stateline.org/feed/" },
    ],
  },
  {
    id: "world",
    name: "World",
    sources: [
      { name: "BBC News", url: "https://feeds.bbci.co.uk/news/world/rss.xml" }, // ads outside the UK
      { name: "NPR", url: "https://feeds.npr.org/1004/rss.xml" },
      { name: "PBS NewsHour", url: "https://www.pbs.org/newshour/feeds/rss/world" },
      {
        name: "The Guardian", // ads
        url: "https://www.theguardian.com/world/rss",
        only: /theguardian\.com\/(world|global-development)\//,
      },
      { name: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml" }, // ads
      { name: "DW", url: "https://rss.dw.com/rdf/rss-en-world" },
      { name: "UN News", url: "https://news.un.org/feed/subscribe/en/news/all/rss.xml" },
    ],
  },
  {
    id: "environment",
    name: "Environment",
    sources: [
      { name: "Inside Climate News", url: "https://insideclimatenews.org/feed/" },
      { name: "Grist", url: "https://grist.org/feed/" },
      { name: "Yale Environment 360", url: "https://e360.yale.edu/feed.xml" },
      { name: "Mongabay", url: "https://news.mongabay.com/feed/" },
      { name: "Carbon Brief", url: "https://www.carbonbrief.org/feed" },
      { name: "NPR", url: "https://feeds.npr.org/1025/rss.xml" },
      {
        name: "The Guardian", // ads
        url: "https://www.theguardian.com/environment/rss",
        only: /theguardian\.com\/environment\//,
      },
    ],
  },
  {
    id: "science",
    name: "Science",
    sources: [
      { name: "NASA", url: "https://www.nasa.gov/feed/" },
      { name: "Quanta Magazine", url: "https://www.quantamagazine.org/feed/" },
      { name: "Science News", url: "https://www.sciencenews.org/feed" },
      { name: "NPR", url: "https://feeds.npr.org/1007/rss.xml" },
      { name: "Knowable Magazine", url: "https://knowablemagazine.org/rss" },
      { name: "Ars Technica", url: "https://arstechnica.com/science/feed/" }, // ads
    ],
  },
  {
    id: "coding-ai",
    name: "Coding & AI",
    sources: [
      { name: "Ars Technica", url: "https://arstechnica.com/ai/feed/" }, // ads
      { name: "Simon Willison", url: "https://simonwillison.net/atom/everything/" },
      { name: "GitHub Blog", url: "https://github.blog/feed/" },
      { name: "Hugging Face", url: "https://huggingface.co/blog/feed.xml" },
      { name: "Stack Overflow Blog", url: "https://stackoverflow.blog/feed/" },
      { name: "Hacker News", url: "https://news.ycombinator.com/rss", summaries: false },
    ],
  },
  {
    // Anthropic publishes no feeds; the Claude blog and Anthropic Engineering
    // ones are built from its pages by github.com/Olshansk/rss-feeds (MIT).
    id: "claude-code",
    name: "Claude Code",
    sources: [
      { name: "Claude Code", url: "https://github.com/anthropics/claude-code/releases.atom" },
      { name: "Claude Blog", url: "https://raw.githubusercontent.com/Olshansk/rss-feeds/main/feeds/feed_claude.xml" },
      {
        name: "Anthropic Engineering",
        url: "https://raw.githubusercontent.com/Olshansk/rss-feeds/main/feeds/feed_anthropic_engineering.xml",
      },
      { name: "Simon Willison", url: "https://simonwillison.net/tags/claude-code.atom" },
      { name: "DEV", url: "https://dev.to/feed/tag/claudecode" }, // ads
      { name: "Hacker News", url: "https://hnrss.org/newest?q=%22claude+code%22&points=20", summaries: false },
    ],
  },
  {
    id: "vibe-coding",
    name: "Vibe Coding",
    sources: [
      { name: "Lobsters", url: "https://lobste.rs/t/vibecoding.rss" },
      { name: "DEV", url: "https://dev.to/feed/tag/vibecoding" }, // ads
      { name: "Simon Willison", url: "https://simonwillison.net/tags/vibe-coding.atom" },
      { name: "Hacker News", url: "https://hnrss.org/newest?q=%22vibe+coding%22&points=10", summaries: false },
    ],
  },
  {
    id: "open-source",
    name: "Open Source",
    sources: [
      { name: "LWN.net", url: "https://lwn.net/headlines/rss", skip: /^\[\$\]|^Security updates for/ },
      { name: "It's FOSS", url: "https://news.itsfoss.com/rss/" }, // ads
      { name: "Lobsters", url: "https://lobste.rs/t/release.rss" },
      { name: "Open Source Initiative", url: "https://opensource.org/feed" },
      { name: "Linux Foundation", url: "https://www.linuxfoundation.org/blog/rss.xml" },
      { name: "Apache", url: "https://news.apache.org/feed" },
      { name: "GitHub Blog", url: "https://github.blog/open-source/feed/" },
    ],
  },
  {
    id: "gis",
    name: "GIS",
    sources: [
      { name: "Planet OSGeo", url: "https://planet.osgeo.org/rss20.xml" },
      { name: "QGIS", url: "https://blog.qgis.org/feed/" },
      { name: "OpenStreetMap", url: "https://blog.openstreetmap.org/feed/" },
      {
        name: "NASA Earth Observatory",
        url: "https://earthobservatory.nasa.gov/feeds/earth-observatory.rss",
        only: /\/earth\/earth-observatory\//,
      },
      { name: "Maps Mania", url: "https://googlemapsmania.blogspot.com/feeds/posts/default" }, // ads
      { name: "The Map Room", url: "https://www.maproomblog.com/feed/" },
      { name: "Spatial Source", url: "https://www.spatialsource.com.au/feed" }, // ads
      { name: "Overture Maps", url: "https://overturemaps.org/feed/" },
    ],
  },
];
