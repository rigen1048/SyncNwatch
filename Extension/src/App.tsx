import { useUniqueId } from "../utility/uniqueId";
import { useActivation } from "./components/Activation";
import RoomLink from "./components/Roomlink";
import RoomLock from "./components/Roomlock";

function App() {
  const { uniqueId, handleChangeId } = useUniqueId();
  const {
    isActive,
    isLocked,
    activeMode,
    videoButtonText,
    scrollButtonText,
    statusText,
    circleColor,
    isVideoButtonDisabled,
    isScrollButtonDisabled,
    ping,
    handleToggle,
  } = useActivation();

  return (
    <>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        @keyframes pulse-glow {
          0% { box-shadow: 0 0 0 0 rgba(34, 197, 244, 0.7); }
          70% { box-shadow: 0 0 0 20px rgba(34, 197, 244, 0); }
          100% { box-shadow: 0 0 0 0 rgba(34, 197, 244, 0); }
        }

        @keyframes scroll-glow {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          70% { box-shadow: 0 0 0 20px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }

        @keyframes slide-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        html, body {
          margin: 0;
          padding: 0;
          width: 360px;
          height: auto;
          background: transparent;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        body {
          width: 360px;
        }
      `}</style>

      <div
        style={{
          width: "360px",
          minHeight: "100vh",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          color: "#e2e8f0",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          display: "flex",
          flexDirection: "column",
          padding: "24px 20px",
          gap: "24px",
          border: "1px solid #334155",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", animation: "slide-in 0.5s ease" }}>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "700",
              background: "linear-gradient(135deg, #22d3ee, #10b981)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              marginBottom: "4px",
              letterSpacing: "-0.5px",
            }}
          >
            SyncNwatch
          </h1>
          <p
            style={{
              fontSize: "12px",
              color: "#94a3b8",
              fontWeight: "500",
              letterSpacing: "0.5px",
            }}
          >
            SYNCHRONIZED VIEWING
          </p>
        </div>

        {/* Status Card */}
        <div
          style={{
            background: "rgba(30, 41, 59, 0.6)",
            border: "1px solid #334155",
            borderRadius: "12px",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            animation: "slide-in 0.6s ease",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <div
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: circleColor,
                boxShadow:
                  (isActive || isLocked) && activeMode === "video"
                    ? "0 0 12px rgba(34, 197, 244, 0.6)"
                    : (isActive || isLocked) && activeMode === "scroll"
                      ? "0 0 12px rgba(16, 185, 129, 0.6)"
                      : "none",
              }}
            />
            <span
              style={{
                fontSize: "13px",
                fontWeight: "600",
                color: "#e2e8f0",
              }}
            >
              {statusText}
            </span>
          </div>

          {(isActive || isLocked) && ping > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: "8px",
                borderTop: "1px solid #475569",
                fontSize: "11px",
                color: "#64748b",
              }}
            >
              <span>Latency</span>
              <span
                style={{
                  fontFamily: "monospace",
                  fontWeight: "600",
                  color: "#22d3ee",
                }}
              >
                {ping}ms
              </span>
            </div>
          )}
        </div>

        {/* Sync Mode Buttons */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            animation: "slide-in 0.7s ease",
          }}
        >
          {/* Video Sync Button */}
          <button
            onClick={() => handleToggle("video")}
            disabled={
              isVideoButtonDisabled ||
              ((isActive || isLocked) && activeMode === "scroll")
            }
            style={{
              width: "100%",
              height: "48px",
              borderRadius: "10px",
              border: "none",
              background:
                (isActive || isLocked) && activeMode === "video"
                  ? "linear-gradient(135deg, #22d3ee, #0891b2)"
                  : isVideoButtonDisabled ||
                      ((isActive || isLocked) && activeMode === "scroll")
                    ? "#1e293b"
                    : "#334155",
              boxShadow:
                (isActive || isLocked) && activeMode === "video"
                  ? "0 0 20px rgba(34, 197, 244, 0.4), 0 8px 16px rgba(0,0,0,0.3)"
                  : "0 4px 12px rgba(0,0,0,0.2)",
              cursor:
                isVideoButtonDisabled ||
                ((isActive || isLocked) && activeMode === "scroll")
                  ? "not-allowed"
                  : "pointer",
              opacity:
                isVideoButtonDisabled ||
                ((isActive || isLocked) && activeMode === "scroll")
                  ? 0.5
                  : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "14px",
              fontWeight: "600",
              textTransform: "uppercase",
              letterSpacing: "0.8px",
              transition: "all 0.3s ease",
              animation:
                (isActive || isLocked) && activeMode === "video"
                  ? "pulse-glow 2s infinite"
                  : "none",
              outline: "none",
            }}
            onMouseEnter={(e) => {
              if (
                !isVideoButtonDisabled &&
                !((isActive || isLocked) && activeMode === "scroll")
              ) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 6px 16px rgba(0,0,0,0.3)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                (isActive || isLocked) && activeMode === "video"
                  ? "0 0 20px rgba(34, 197, 244, 0.4), 0 8px 16px rgba(0,0,0,0.3)"
                  : "0 4px 12px rgba(0,0,0,0.2)";
            }}
          >
            ▶ {videoButtonText}
          </button>

          {/* Scroll Sync Button */}
          <button
            onClick={() => handleToggle("scroll")}
            disabled={
              isScrollButtonDisabled ||
              ((isActive || isLocked) && activeMode === "video")
            }
            style={{
              width: "100%",
              height: "48px",
              borderRadius: "10px",
              border: "none",
              background:
                (isActive || isLocked) && activeMode === "scroll"
                  ? "linear-gradient(135deg, #10b981, #059669)"
                  : isScrollButtonDisabled ||
                      ((isActive || isLocked) && activeMode === "video")
                    ? "#1e293b"
                    : "#334155",
              boxShadow:
                (isActive || isLocked) && activeMode === "scroll"
                  ? "0 0 20px rgba(16, 185, 129, 0.4), 0 8px 16px rgba(0,0,0,0.3)"
                  : "0 4px 12px rgba(0,0,0,0.2)",
              cursor:
                isScrollButtonDisabled ||
                ((isActive || isLocked) && activeMode === "video")
                  ? "not-allowed"
                  : "pointer",
              opacity:
                isScrollButtonDisabled ||
                ((isActive || isLocked) && activeMode === "video")
                  ? 0.5
                  : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "14px",
              fontWeight: "600",
              textTransform: "uppercase",
              letterSpacing: "0.8px",
              transition: "all 0.3s ease",
              animation:
                (isActive || isLocked) && activeMode === "scroll"
                  ? "scroll-glow 2s infinite"
                  : "none",
              outline: "none",
            }}
            onMouseEnter={(e) => {
              if (
                !isScrollButtonDisabled &&
                !((isActive || isLocked) && activeMode === "video")
              ) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 6px 16px rgba(0,0,0,0.3)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                (isActive || isLocked) && activeMode === "scroll"
                  ? "0 0 20px rgba(16, 185, 129, 0.4), 0 8px 16px rgba(0,0,0,0.3)"
                  : "0 4px 12px rgba(0,0,0,0.2)";
            }}
          >
            ⬇ {scrollButtonText}
          </button>
        </div>

        {/* Divider */}
        <div
          style={{
            height: "1px",
            background: "linear-gradient(90deg, transparent, #334155, transparent)",
            animation: "slide-in 0.8s ease",
          }}
        />

        {/* User ID Section */}
        <div
          style={{
            background: "rgba(30, 41, 59, 0.4)",
            border: "1px solid #334155",
            borderRadius: "10px",
            padding: "14px",
            animation: "slide-in 0.9s ease",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                fontWeight: "600",
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              User ID
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: "13px",
                  fontWeight: "700",
                  letterSpacing: "1px",
                  color: "#22d3ee",
                  wordBreak: "break-all",
                }}
              >
                {uniqueId || "········"}
              </span>
              <button
                onClick={handleChangeId}
                style={{
                  width: "28px",
                  height: "28px",
                  background: "#334155",
                  border: "1px solid #475569",
                  borderRadius: "6px",
                  color: "#94a3b8",
                  fontSize: "12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                  fontWeight: "600",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "#475569";
                  e.currentTarget.style.color = "#22d3ee";
                  e.currentTarget.style.borderColor = "#22d3ee";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "#334155";
                  e.currentTarget.style.color = "#94a3b8";
                  e.currentTarget.style.borderColor = "#475569";
                }}
              >
                ↻
              </button>
            </div>
          </div>
        </div>

        {/* Room Controls */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            animation: "slide-in 1s ease",
          }}
        >
          <RoomLink />
          <RoomLock />
        </div>

        {/* Footer */}
        <div
          style={{
            textAlign: "center",
            paddingTop: "12px",
            borderTop: "1px solid #334155",
            fontSize: "10px",
            color: "#64748b",
            animation: "slide-in 1.1s ease",
          }}
        >
          <p style={{ margin: "0" }}>v1.0.0 • Lightweight Sync</p>
        </div>
      </div>
    </>
  );
}

export default App;
