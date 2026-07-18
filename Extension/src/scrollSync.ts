let isListening = false;
let lastSentScroll = -1;
let isApplyingScroll = false;

export function enableScrollSync() {
  if (isListening) return;
  isListening = true;
  window.addEventListener("scroll", handleScroll, { passive: true });
  console.log("[scrollSync] Enabled");
}

export function disableScrollSync() {
  if (!isListening) return;
  isListening = false;
  window.removeEventListener("scroll", handleScroll);
  console.log("[scrollSync] Disabled");
}

function getScrollState() {
  const root = document.documentElement;
  const body = document.body;
  const top = Math.round(window.scrollY ?? root.scrollTop ?? body.scrollTop ?? 0);

  return { top };
}

let lastSentTs = 0;

function handleScroll() {
  if (isApplyingScroll || document.hidden) return;

  const state = getScrollState();
  const now = Date.now();

  // Throttle to ~30ms
  if (now - lastSentTs < 30) return;

  const scrollValue = state.top;

  // Use absolute pixel difference for threshold (e.g., 5 pixels)
  if (Math.abs(scrollValue - lastSentScroll) > 5) {
    lastSentScroll = scrollValue;
    lastSentTs = now;
    chrome.runtime.sendMessage({ type: "scrollUpdate", value: scrollValue });
  }
}

export function applyScroll(absoluteTop: number) {
  isApplyingScroll = true;
  window.scrollTo({
    top: absoluteTop,
    left: 0,
    behavior: "instant",
  });

  lastSentScroll = absoluteTop;

  // Reset after a short delay to allow the scroll event to fire and be ignored
  setTimeout(() => {
    isApplyingScroll = false;
  }, 50);
}
