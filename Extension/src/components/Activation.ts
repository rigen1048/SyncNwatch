import { useState, useEffect } from "react";
import {
  onConnectionStatusChange,
  type ConnectionStatus,
  getCurrentConnectionStatus,
  refreshVideoConnection,
} from "../../utility/connection";

export function useActivation() {
  const [isActive, setIsActive] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [activeMode, setActiveMode] = useState<"video" | "scroll" | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("searching");
  const [ping, setPing] = useState<number>(0);

  // Real-time updates via events
  useEffect(() => {
    const unsubscribe = onConnectionStatusChange((status) => {
      setConnectionStatus(status);
    });
    return unsubscribe;
  }, []);

  // Listen for immediate ping updates and poll as fallback
  useEffect(() => {
    if (!isActive && !isLocked) {
      setPing(0);
      return;
    }

    const fetchPing = async () => {
      try {
        const response = await chrome.runtime.sendMessage({ type: "getPing" });
        if (response && typeof response.ping === "number") {
          setPing(response.ping);
        }
      } catch (err) {
        // Background might be restarting
      }
    };

    const handleMessage = (message: any) => {
      if (message.type === "pingUpdate" && typeof message.ping === "number") {
        setPing(message.ping);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    fetchPing(); // Initial fetch

    // Fallback polling every 5s just in case message is missed
    const interval = setInterval(fetchPing, 5000);

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
      clearInterval(interval);
    };
  }, [isActive, isLocked]);

  // Gentle polling when not clearly connected
  useEffect(() => {
    // Only poll if we're in ambiguous states: "searching" or "none"
    if (connectionStatus === "connected") return;

    let cancelled = false;

    const check = async () => {
      if (cancelled) return;

      // Force a fresh status request from content script
      await refreshVideoConnection();

      if (!cancelled) {
        const newStatus = getCurrentConnectionStatus();
        if (newStatus !== connectionStatus) {
          setConnectionStatus(newStatus);
        }
      }
    };

    // Initial check
    check();

    // Poll every 800ms when not connected
    const interval = setInterval(check, 800);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [connectionStatus]);

  const getCurrentTabId = async (): Promise<number | undefined> => {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    return tab?.id;
  };

  // Restore activation + force connection refresh on popup open
  useEffect(() => {
    const restore = async () => {
      try {
        // 1. Force refresh connection status
        await refreshVideoConnection();

        // 2. Check activation state from background
        const response = await chrome.runtime.sendMessage({
          type: "checkActivation",
        });

        if (response?.isCurrentTabActive) {
          setIsActive(true);
          setIsLocked(false);
          setActiveMode(response.storedMode || "video");
        } else if (response?.storedTabId !== null) {
          setIsActive(false);
          setIsLocked(true);
          setActiveMode(response.storedMode || "video");
        } else {
          setIsActive(false);
          setIsLocked(false);
          setActiveMode(null);
        }

        // Sync local connection status after restore
        setConnectionStatus(getCurrentConnectionStatus());
      } catch (err) {
        console.warn(
          "[useActivation] Background not ready or no content script",
          err,
        );
        setIsActive(false);
        setIsLocked(false);
      }
    };

    restore();
  }, []);

  // Toggle activation
  const handleToggle = async (mode: "video" | "scroll" = "video") => {
    const tabId = await getCurrentTabId();
    if (!tabId) {
      console.warn("[useActivation] No active tab");
      return;
    }

    if (isActive || isLocked) {
      // === DEACTIVATE ===
      try {
        await chrome.runtime.sendMessage({ type: "stopActivation" });
        console.log("[useActivation] Deactivated successfully");
      } catch (err) {
        console.error("[useActivation] Failed to stop activation:", err);
      }

      setIsActive(false);
      setIsLocked(false);
      setActiveMode(null);

      // Force re-check connection after deactivation (content script may still send status)
      await refreshVideoConnection();
    } else {
      // === ACTIVATE ===
      if (mode === "video" && connectionStatus !== "connected") {
        console.log(
          "[useActivation] Cannot activate video sync: not connected",
          connectionStatus,
        );
        return;
      }

      if (isLocked) {
        console.log("[useActivation] Cannot activate: locked by another tab");
        return;
      }

      try {
        await chrome.runtime.sendMessage({
          type: "startActivation",
          tabId,
          mode,
        });
        console.log(`[useActivation] Activated tab ${tabId} in ${mode} mode`);
        setIsActive(true);
        setIsLocked(false);
        setActiveMode(mode);
      } catch (err) {
        console.error("[useActivation] Failed to start activation:", err);
      }
    }
  };

  // UI derivations
  const videoButtonText =
    (isActive || isLocked) && activeMode === "video"
      ? "Deactivate Video"
      : "Activate Video";
  const scrollButtonText =
    (isActive || isLocked) && activeMode === "scroll"
      ? "Deactivate Scroll"
      : "Activate Scroll";

  const isVideoButtonDisabled =
    (isLocked && activeMode !== "video") ||
    (connectionStatus !== "connected" && !isActive && !isLocked);
  const isScrollButtonDisabled = isLocked && activeMode !== "scroll";

  const statusText = isActive
    ? `Active (${activeMode} sync)`
    : isLocked
      ? `Active in another tab (${activeMode})`
      : connectionStatus === "connected"
        ? "Video Connected"
        : connectionStatus === "searching"
          ? "Searching for video..."
          : "No video detected";

  const circleColor =
    isActive || isLocked
      ? "#10b981" // green when active
      : connectionStatus === "connected"
        ? "#10b981" // green when video found
        : connectionStatus === "searching"
          ? "#fbbf24" // yellow when searching
          : "#ef4444"; // red when no video

  return {
    isActive,
    isLocked,
    activeMode,
    ping,
    videoButtonText,
    scrollButtonText,
    statusText,
    circleColor,
    isConnected: connectionStatus === "connected",
    isVideoButtonDisabled,
    isScrollButtonDisabled,
    handleToggle,
  };
}
