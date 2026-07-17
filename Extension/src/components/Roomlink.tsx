import { useState, useEffect } from "react";

export default function RoomLink() {
  const [roomLink, setRoomLink] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");

  useEffect(() => {
    const fetchUrl = async () => {
      const response = await chrome.runtime.sendMessage({ type: "getUrl" });
      if (response?.url) {
        setCurrentUrl(response.url);
        setRoomLink(response.url);
      }
    };
    fetchUrl();
  }, []);

  const handleSendLink = () => {
    const link = roomLink.trim();
    if (!link) return;

    console.log("Room link submitted:", link);

    chrome.runtime.sendMessage({
      type: "ChangeUrl",
      url: link,
    });

    setCurrentUrl(link);
    setIsEditing(false);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        background: "rgba(30, 41, 59, 0.4)",
        border: "1px solid #334155",
        borderRadius: "10px",
        padding: "14px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ letterSpacing: "1px", fontSize: "11px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase" }}>Sync Link</span>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {!isEditing ? (
            <>
              <span
                style={{
                  fontSize: "12px",
                  color: "#22d3ee",
                  maxWidth: "140px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontFamily: "monospace",
                  fontWeight: "500",
                }}
              >
                {currentUrl || "ws://..."}
              </span>
              <button
                onClick={() => setIsEditing(true)}
                style={{
                  padding: "6px 12px",
                  background: "#334155",
                  border: "1px solid #475569",
                  borderRadius: "6px",
                  color: "#94a3b8",
                  fontSize: "11px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "#475569";
                  e.currentTarget.style.color = "#22d3ee";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "#334155";
                  e.currentTarget.style.color = "#94a3b8";
                }}
              >
                ✎ Edit
              </button>
            </>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <input
                type="text"
                placeholder="ws://..."
                value={roomLink}
                onChange={(e) => setRoomLink(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendLink()}
                autoFocus
                style={{
                  width: "120px",
                  padding: "4px 8px",
                  background: "#1e293b",
                  border: "1px solid #22d3ee",
                  borderRadius: "5px",
                  color: "#e2e8f0",
                  fontSize: "11px",
                  outline: "none",
                }}
              />
              <button
                onClick={handleSendLink}
                style={{
                  background: "#22d3ee",
                  border: "none",
                  borderRadius: "5px",
                  color: "#0f172a",
                  padding: "4px 8px",
                  fontSize: "10px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setRoomLink(currentUrl);
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#64748b",
                  fontSize: "10px",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
