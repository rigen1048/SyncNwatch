# SyncNwatch – Universal Real-Time Video Sync Extension

**Lightweight Chrome extension** (~1k LOC) for **end-to-end encrypted, site-agnostic synchronized video playback** with friends.

Works on YouTube, Netflix, Disney+, Prime Video, local files, Vimeo, arbitrary streaming sites, SPAs, shadow DOM, cross-origin iframes, and DRM-protected players.

Play/pause, seek, speed — near-perfect sync with absolute state enforcement and minimal drift.

## Key Features
**Key Features**
- **Dual Synchronization Modes**  
  - Video Sync for anime, movies, series, and videos  
  - Scroll Sync for manga, comics, and webtoons
- **Intelligent Tab Management**  
  - Automatically disables sync on inactive tabs  
  - Seamless desynchronization when tabs are closed
- **Universal Video Detection** — Reliably identifies the correct video player even with multiple ads playing, nested iframes, dynamic DOM, and shadow roots
- **Absolute State Synchronization** — Precise playback and scroll position with zero drift
- **Secure Cloudflare Integration** — Leverages free Cloudflare link sharing for E2EE, outbound-only connections, no public IP exposure, and built-in DDoS/WAF protection
- **High-Performance Custom Binary WebSocket** — Delivers ~5 ms localhost and ~250 ms global latency with maximum uptime, overcoming typical Cloudflare limitations
- **Noise-Free Event Handling** — Captures only genuine user interactions, filtering out HTML5 noise
- **Automatic Reconnection** — Reliable recovery from network interruptions
- **Clean, Minimal Interface**

**Intentional Scope Exclusions**
- **No volume synchronization** – Preserves users’ individual audio preferences and device-specific settings.
- **No built-in chat** – Designed as a lightweight complement to existing messaging platforms, maximizing privacy and avoiding vendor lock-in.
- **No standalone connection forwarding** – Prioritizes maximum privacy and the smallest possible attack surface.

## Demo (The Ui has changed)
https://github.com/user-attachments/assets/b2370619-cced-4740-ab26-df9cf7c17990


## Quick Setup

**Dependencies**
Python 3 • Node.js • Bun • Cloudflare account

**Extension**

```bash
git clone https://github.com/rigen1048/syncnwatch
cd Extension
bun install
bun run build # the dist file will be created which is extension
```

→ Load unpacked in `chrome://extensions/` (Developer mode)

**Server**

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

Then in another terminal:

```bash
cloudflared tunnel --url http://localhost:8001
```

→ Share the tunnel URL
→ Both users open the extension popup, paste the URL, and activate

## Current Limitations
- No automatic buffering protection – Users should coordinate pauses manually with their counterpart when buffering occurs.
- Occasional synchronization conflicts (“zigzag” effect) – May occur when both parties interact simultaneously. Workaround: Temporarily disable and re-enable sync to restore alignment.

## ⚠️ Important – No License Yet

This project currently has **no LICENSE file**.

Under default copyright law ("all rights reserved"):

**Allowed:**
- View the code
- Fork on GitHub (per GitHub ToS)
- Clone and run locally **for personal evaluation, learning, technical discussion, portfolio review, or interview purposes** (fair use)

**Not allowed without explicit permission:**
- Modify, distribute, sublicense, or create derivative works
- Use in production, commercial products, public demos, or any redistributed form
- Upload modified versions elsewhere or claim as your own

The author has not yet decided on a final license (MIT, GPL, proprietary, etc.) as distribution plans (portfolio-only vs commercial/open-source) are still under consideration.

If you want to use/modify this beyond personal evaluation, please contact the author via GitHub issue or email for permission.

Thank you for respecting these terms.

## Contributions

Not accepted until a license is finalized (to avoid legal complications).
Thanks for your understanding!
