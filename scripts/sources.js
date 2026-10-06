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
];
