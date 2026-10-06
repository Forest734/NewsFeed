// Small pure helpers for app.js, kept apart so tests/lib.test.js can run
// them under Node.

// How long ago an ISO time was: "just now", "5m ago", "3h ago", "2d ago".
export function timeAgo(iso, now = Date.now()) {
  const minutes = Math.floor((now - Date.parse(iso)) / 60_000);
  if (!(minutes >= 1)) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// The category a location hash names ("#science"), or the first one.
export function pickCategory(categories, hash) {
  const id = decodeURIComponent(hash.replace(/^#\/?/, ""));
  return categories.find((c) => c.id === id) ?? categories[0];
}
