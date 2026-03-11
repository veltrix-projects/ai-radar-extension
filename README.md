# AI Radar Extension v2

Real-time AI news aggregator Chrome extension. Reads from a GitHub Pages backend — no local fetching, no storage complexity, no folder pickers.

## Setup

### 1. Deploy the backend first
See `ai-radar-backend` repo. You need a working GitHub Pages URL before the extension works.

### 2. Build the extension
```bash
npm install
npm run build
```

### 3. Load in Chrome
- Open `chrome://extensions`
- Enable **Developer Mode** (top right)
- Click **Load unpacked**
- Select the `dist/` folder

### 4. Configure backend URL
- Click the extension icon → Settings (⚙)
- Enter your GitHub Pages URL
- Click **Test Connection** to verify
- Click **Save Settings**

## What changed from v1

| v1 | v2 |
|---|---|
| Fetches from 7 sources locally | Reads from GitHub Pages (16 sources) |
| Stores in IndexedDB | No local storage |
| Tries to save to disk (broken) | Archive reads from GitHub Pages |
| Folder picker (Chrome blocked) | No folder picker needed |
| Keyword-based priority | Gemini AI scoring (0-10) |
| Service worker polls every 5min | Service worker checks badge only |

## Architecture

```
Backend (GitHub Actions, every 5 min)
  → Fetches 16 sources
  → Scores with Gemini Flash
  → Commits to gh-pages every 30 min

Extension
  → Reads from GitHub Pages URLs
  → Shows AI-scored news
  → Archive viewer reads any date
```

## File structure

```
src/
├── background/service-worker.js  — badge + notifications only
├── dashboard/DashboardApp.jsx    — main news dashboard
├── popup/PopupApp.jsx            — extension popup (300×210)
├── archive/ArchiveApp.jsx        — calendar archive viewer
├── options/OptionsApp.jsx        — settings page
├── components/
│   ├── NewsCard.jsx              — individual news item
│   └── SectionHeader.jsx        — panel header
└── lib/
    ├── api.js                    — GitHub Pages API client
    └── utils.js                  — shared helpers
```
