import { open, close, setWebSocketUrl, getWebSocketUrl } from "./components/websocket";
import { start, stop } from "./Data/observationFilter";
import { enable, disable } from "./Data/listen";
import { startPing, stopPing, getPing } from "./Data/ping";
import { sendPacket } from "./Data/translator";

let checkInterval = null;
let currentMode = null; // 'video' or 'scroll'

//Starts all synchronization services.
function yes(mode = 'video') {
  currentMode = mode;
  open();
  if (mode === 'video') {
    start();
    enable();
  } else if (mode === 'scroll') {
    // Scroll sync logic is handled via messages to/from content scripts
    // but we need to enable the listener in the background to relay if needed
    // Actually, the existing 'enable()' in listen.ts handles incoming packets.
    // We should make sure listen.ts can handle scroll packets.
    enable(); 
  }
  startPing();
}

// Stops all synchronization services and clears the periodic check.
async function no() {
  stopPeriodicCheck();
  stopPing();
  disable();
  stop();
  close();

  // Explicitly disable scroll sync in the active tab if it was the mode
  if (currentMode === 'scroll') {
    try {
      const result = await chrome.storage.session.get("1");
      const storedTabId = result["1"];
      if (storedTabId) {
        chrome.tabs.sendMessage(storedTabId, { type: "disableScrollSync" });
      }
    } catch (err) {
      console.error("[background] Failed to send disableScrollSync:", err);
    }
  }

  currentMode = null;
}

/**
 * Periodically verifies if the stored active tab still exists.
 * If the tab is gone, it automatically clears the activation state.
 * This runs ONLY when a tab is activated.
 */
function startPeriodicCheck() {
  if (checkInterval) return;

  console.log("[background] Starting periodic tab check");
  checkInterval = setInterval(async () => {
    try {
      const result = await chrome.storage.session.get("1");
      const storedTabId = result["1"];

      if (!storedTabId) {
        stopPeriodicCheck();
        return;
      }

      try {
        // Verify if the tab still exists
        await chrome.tabs.get(storedTabId);
      } catch (e) {
        // Tab no longer exists (e.g., closed, crashed)
        console.log(`[background] Tab ${storedTabId} no longer exists. Clearing activation.`);
        await chrome.storage.session.remove("1");
        no();
      }
    } catch (err) {
      console.error("[background] Error in periodic check:", err);
    }
  }, 5000); // Check every 5 seconds
}


function stopPeriodicCheck() {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
    console.log("[background] Periodic tab check stopped");
  }
}

// Listener for tab closure to ensure we clear activation if the synced tab is closed
chrome.tabs.onRemoved.addListener(async (tabId) => {
  try {
    const result = await chrome.storage.session.get("1");
    const storedTabId = result["1"];
    if (storedTabId === tabId) {
      console.log("[background] Synced tab closed, stopping activation");
      await chrome.storage.session.remove("1");
      no();
    }
  } catch (err) {
    console.error("[background] Error in onRemoved listener:", err);
  }
});

// Listener for tab updates to handle page navigation
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    try {
      const sessionData = await chrome.storage.session.get(["1", "mode"]);
      const storedTabId = sessionData["1"];
      const storedMode = sessionData["mode"];

      if (storedTabId === tabId && storedMode === 'scroll') {
        console.log(`[background] Tab ${tabId} navigated. Re-enabling scroll sync.`);
        chrome.tabs.sendMessage(tabId, { type: "enableScrollSync" });
      }
    } catch (err) {
      console.error("[background] Error in onUpdated listener:", err);
    }
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // === Legacy: Get Tab ID ===
  if (message.type === "getTabId" && sender.tab) {
    sendResponse({ tabId: sender.tab.id });
    return false;
  }

  // === Check stored activation ===
  if (message.type === "checkActivation") {
    (async () => {
      try {
        const [currentTab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        
        const currentTabId = currentTab?.id ?? null;
        const sessionData = await chrome.storage.session.get(["1", "mode"]);
        const storedTabId = sessionData["1"] ?? null;
        const storedMode = sessionData["mode"] ?? null;

        // If a tab is stored but doesn't exist anymore, clear it immediately
        if (storedTabId !== null) {
          try {
            await chrome.tabs.get(storedTabId);
          } catch (e) {
            console.log("[background] checkActivation: Stored tab missing, clearing.");
            await chrome.storage.session.remove("1");
            no();
            sendResponse({
              storedTabId: null,
              isCurrentTabActive: false,
            });
            return;
          }
        }

        sendResponse({
          storedTabId,
          storedMode,
          isCurrentTabActive: currentTabId !== null && storedTabId === currentTabId,
        });
      } catch (err) {
        console.error("[background] Error in checkActivation:", err);
        sendResponse({
          storedTabId: null,
          isCurrentTabActive: false,
        });
      }
    })();
    return true; // async response
  }

  // === Start activation ===
  if (message.type === "startActivation" && message.tabId != null) {
    (async () => {
      try {
        const mode = message.mode || 'video';
        await chrome.storage.session.set({ 1: message.tabId, "mode": mode });
        yes(mode);
        
        // Notify the tab to start its specific sync
        if (mode === 'scroll') {
          chrome.tabs.sendMessage(message.tabId, { type: "enableScrollSync" });
        }

        startPeriodicCheck(); // Start checking now that we have an active tab
        console.log(`[background] Activation started for tab: ${message.tabId} mode: ${mode}`);
      } catch (err) {
        console.error("[background] Failed to start activation:", err);
      }
    })();
    return false;
  }

  // === Stop activation ===
  if (message.type === "stopActivation") {
    (async () => {
      try {
        await chrome.storage.session.remove("1");
        no(); // This also stops the periodic check
        console.log("[background] Activation stopped manually");
      } catch (err) {
        console.error("[background] Failed to stop activation:", err);
      }
    })();
    return false;
  }

  // === Change WebSocket URL ===
  if (message.type === "ChangeUrl") {
    if (typeof message.url !== "string" || message.url.trim() === "") {
      sendResponse({ success: false, error: "Invalid URL" });
      return false;
    }

    const newUrl = message.url.trim();
    setWebSocketUrl(newUrl);

    (async () => {
      try {
        const result = await chrome.storage.session.get("1");
        if (result["1"] != null) {
          no();
          yes();
          startPeriodicCheck();
          console.log("[background] WebSocket reconnected with new URL:", newUrl);
        }
      } catch (err) {
        console.error("[background] Error checking activation during URL change:", err);
      }
    })();

    sendResponse({ success: true, newUrl });
    return false;
  }

  if (message.type === "getUrl") {
    sendResponse({ url: getWebSocketUrl() });
    return false;
  }

  if (message.type === "getPing") {
    sendResponse({ ping: getPing() });
    return false;
  }

  if (message.type === "scrollUpdate") {
    sendPacket("s", message.value);
    return false;
  }

  return false;
});

chrome.storage.session.get("1").then(result => {
  if (result["1"]) {
    startPeriodicCheck();
  }
});
