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
  const top = window.scrollY ?? root.scrollTop ?? body.scrollTop ?? 0;
  const scrollHeight = root.scrollHeight || body.scrollHeight || 0;
  const clientHeight = root.clientHeight || window.innerHeight || 0;

  return {
    top,
    percentage:
      scrollHeight > clientHeight ? top / (scrollHeight - clientHeight) : 0,
  };
}

let lastSentTs = 0;

function handleScroll() {
  if (isApplyingScroll || document.hidden) return;

  const state = getScrollState();
  const now = Date.now();

  // Throttle to ~30ms
  if (now - lastSentTs < 30) return;

  // Scale percentage to 0-10000 for numeric packet (4 decimal places)
  const scrollValue = Math.round(state.percentage * 10000);

  if (Math.abs(scrollValue - lastSentScroll) > 5) {
    lastSentScroll = scrollValue;
    lastSentTs = now;
    chrome.runtime.sendMessage({ type: "scrollUpdate", value: scrollValue });
  }
}

export function applyScroll(percentage: number) {
  const root = document.documentElement;
  const body = document.body;
  const scrollHeight = root.scrollHeight || body.scrollHeight || 0;
  const clientHeight = root.clientHeight || window.innerHeight || 0;

  const targetTop = percentage * (scrollHeight - clientHeight);

  isApplyingScroll = true;
  window.scrollTo({
    top: targetTop,
    left: 0,
    behavior: "instant",
  });

  lastSentScroll = Math.round(percentage * 10000);

  // Reset after a short delay to allow the scroll event to fire and be ignored
  setTimeout(() => {
    isApplyingScroll = false;
  }, 50);
}
