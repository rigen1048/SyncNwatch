import { PacketType, CommandSubEnums, Pcmd, Ucmd } from "./type";
import { receiveBinary } from "../components/websocket";
import { onValueReceived } from "./ping";

//Sends a control command to the content script in the CURRENT ACTIVE TAB.
//Uses chrome.tabs.sendMessage for reliable delivery (unlike runtime.sendMessage).

async function sendControlMessage(message: any) {
  try {
    // Retrieve stored active tab ID from session storage
    const result = await chrome.storage.session.get("1");
    const storedTabId = result["1"] as number | undefined;

    if (storedTabId === undefined || storedTabId === null) {
      console.log("[listen] No stored tab ID found – ignoring sync event.");
      return;
    }

    // Check if the stored tab is still active and visible
    const tab = await chrome.tabs.get(storedTabId);

    if (!tab) {
      console.log(`[listen] Tab ${storedTabId} not found.`);
      return;
    }

    // If the tab is not active in its window, ignore
    if (!tab.active) {
      console.log(`[listen] Tab ${storedTabId} is not active – ignoring sync event.`);
      return;
    }

    // The window focused: Future Feature Maybe???
    // if (tab.windowId !== undefined) {
    //   const window = await chrome.windows.get(tab.windowId);
    //   if (!window.focused) {
    //     console.log(`[listen] Window ${tab.windowId} is not focused – ignoring sync event.`);
    //     return;
    //   }
    // }

    // Send directly to the content script in that tab
    await chrome.tabs.sendMessage(storedTabId, message);
    console.log(`[listen] Sent to tab ${storedTabId}:`, message);
  } catch (error: any) {
    // Expected when no content script is injected (e.g., not on a video page)
    if (
      error.message?.includes("Receiving end does not exist") ||
      error.message?.includes("Could not establish connection")
    ) {
      console.log(
        "[listen] No content script listening in active tab (normal if not on video page)",
      );
      return;
    }

    // Unexpected errors
    console.error("[listen] Failed to send control message:", message, error);
  }
}


function handleBinaryPacket(data: Uint8Array | ArrayBuffer) {
  const packet = data instanceof Uint8Array ? data : new Uint8Array(data);
  if (packet.byteLength < 2) {
    console.warn("[listen] Received packet too short:", packet);
    return;
  }

  console.log(`[listener] Received packet: [${Array.from(packet).join(", ")}]`);

  const typeByte = packet[0];
  const typeEntry = Object.entries(PacketType).find(
    ([, value]) => value === typeByte,
  );
  if (!typeEntry) {
    console.warn("[listen] Unknown packet type byte:", typeByte);
    return;
  }
  const typeKey = typeEntry[0] as keyof typeof PacketType;

  // Handle 2-byte command packets (p, e, c, u)
  const subEnum = CommandSubEnums[typeKey as keyof typeof CommandSubEnums];
  if (subEnum !== undefined) {
    if (packet.byteLength < 2) {
      console.warn("[listen] Command packet incomplete:", typeKey);
      return;
    }
    const subByte = packet[1];

    switch (typeKey) {
      case "p": // play/pause
        if (subByte === Pcmd.play) {
          sendControlMessage({ type: "play" });
        } else if (subByte === Pcmd.pause) {
          sendControlMessage({ type: "pause" });
        }
        break;

      case "e": // error
        if (subByte === 0x00) {
          console.error("[listen] Server error: Video not found");
          // showError("Video not found");
        }
        break;

      case "u": // user notifications
        switch (subByte) {
          case Ucmd.joined:
            console.log("[listen] A user joined the room");
            // showNotification("A user joined the room");
            break;
          case Ucmd.left:
            console.log("[listen] A user left the room");
            // showNotification("A user left the room");
            break;
          case Ucmd.reconnect:
            console.log("[listen] A user reconnected");
            // showNotification("A user reconnected");
            break;
        }
        break;

      case "c": // server command (usually ignored), Future Feature
        console.log("[listen] Received server command (ignored):", subByte);
        break;
    }
    return;
  }

  // Handle numeric packets (3 bytes for uint16, 5 bytes for uint32)
  if (packet.byteLength < 3) {
    console.warn("[listen] Numeric packet too short for type:", typeKey);
    return;
  }

  let rawValue: number;
  if (packet.byteLength === 3) {
    rawValue = (packet[1] << 8) | packet[2]; // big-endian uint16
  } else if (packet.byteLength === 5) {
    rawValue =
      ((packet[1] << 24) >>> 0) |
      (packet[2] << 16) |
      (packet[3] << 8) |
      packet[4]; // big-endian uint32
  } else {
    console.warn("[listen] Unexpected numeric packet length:", packet.byteLength);
    return;
  }

  switch (typeKey) {
    case "t": // seek timestamp in milliseconds
      console.log(`[listen] Seek to ${rawValue / 1000}s`);
      sendControlMessage({
        type: "seekTo",
        time: rawValue,
      });
      break;

    case "r": // playback rate ×100
      console.log(`[listen] Set speed to ${rawValue / 100}x`);
      sendControlMessage({
        type: "setSpeed",
        speed: rawValue / 100,
      });
      break;

    case "l": // latency
      onValueReceived(rawValue);
      console.log(`[listen] Ping latency: ${rawValue}ms`);
      // updateLatencyDisplay(rawValue);
      break;

    case "d": // drift correction
      console.log(`[listen] Apply drift correction: ${rawValue}`);
      // applyDriftCorrection(rawValue);
      break;

    case "i": // reconnect user ID
      console.log(`[listen] User ID for reconnect: ${rawValue}`);
      // handleReconnectUserId(rawValue);
      break;

    case "s": // scroll position
      console.log(`[listen] Apply scroll offset: ${rawValue}`);
      sendControlMessage({ type: "applyScroll", value: rawValue });
      break;

    default:
      console.warn(
        "[listen] Unhandled numeric packet type:",
        typeKey,
        rawValue,
      );
  }
}

//Optional: Allow content scripts or popup to query the current tab ID
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "getTabId" && sender.tab) {
    sendResponse({ tabId: sender.tab.id });
    return false; // synchronous response
  }
  // Return false by default for async safety
  return false;
});

class PacketListener {
  private isActive: boolean = false;

  public enable() {
    if (this.isActive) return;
    this.isActive = true;
    console.log("[PacketListener] Enabling");
    receiveBinary(handleBinaryPacket);
  }

  public disable() {
    if (!this.isActive) return;
    this.isActive = false;
    console.log("[PacketListener] Disabling");
    // If receiveBinary ever supports unregistering, call it here
  }
}

const listener = new PacketListener();

// Export minimal public API
export const enable = () => listener.enable();
export const disable = () => listener.disable();
