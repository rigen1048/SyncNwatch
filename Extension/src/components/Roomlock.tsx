import { useState } from "react";

export default function RoomLock() {
  const [isRoomLocked, setIsRoomLocked] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "rgba(30, 41, 59, 0.4)",
        border: "1px solid #334155",
        borderRadius: "10px",
        padding: "14px",
      }}
    >
      <span
        style={{
          letterSpacing: "1px",
          fontSize: "11px",
          fontWeight: "600",
          color: "#94a3b8",
          textTransform: "uppercase",
        }}
      >
        Room Lock
      </span>
      <button
        onClick={() => setIsRoomLocked(!isRoomLocked)}
        style={{
          padding: "8px 16px",
          background: isRoomLocked
            ? "linear-gradient(135deg, #22d3ee, #0891b2)"
            : "#334155",
          border: isRoomLocked ? "1px solid #0891b2" : "1px solid #475569",
          borderRadius: "6px",
          color: "#ffffff",
          fontSize: "12px",
          fontWeight: "600",
          letterSpacing: "0.8px",
          cursor: "pointer",
          transition: "all 0.3s",
          minWidth: "60px",
          boxShadow: isRoomLocked
            ? "0 0 12px rgba(34, 197, 244, 0.3)"
            : "none",
        }}
        onMouseOver={(e) => {
          if (!isRoomLocked) {
            e.currentTarget.style.background = "#475569";
            e.currentTarget.style.borderColor = "#64748b";
          }
        }}
        onMouseOut={(e) => {
          if (!isRoomLocked) {
            e.currentTarget.style.background = "#334155";
            e.currentTarget.style.borderColor = "#475569";
          }
        }}
      >
        {isRoomLocked ? "🔒 Locked" : "🔓 Open"}
      </button>
    </div>
  );
}
