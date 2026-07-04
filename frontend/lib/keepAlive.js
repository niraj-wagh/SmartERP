// Pings the Render backend every 14 minutes to prevent it sleeping.
// Render free tier sleeps after 15 min of no requests → causes 502 on first request.
// Call startKeepAlive() once from the root layout or dashboard shell.

const BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const INTERVAL_MS = 14 * 60 * 1000; // 14 minutes

let timer = null;

export function startKeepAlive() {
  if (typeof window === "undefined") return; // server-side — skip
  if (timer) return;                          // already running

  async function ping() {
    try {
      await fetch(`${BACKEND}/api/health`, { method: "GET" });
    } catch {
      // silently ignore — network may be offline
    }
  }

  ping(); // immediate first ping
  timer = setInterval(ping, INTERVAL_MS);
}

export function stopKeepAlive() {
  if (timer) { clearInterval(timer); timer = null; }
}
