# Diggin: Vinyl Price Search

**Stop Searching. Start Diggin.** A Chrome Extension that allows you to highlight text on any website, right-click, and instantly see the current market price for that record on Discogs.

## ✨ Features

- **Context Menu Integration:** Adds a "Search Vinyl for..." option to your right-click menu.
- **Smart Formatting:** Defaults search to **Vinyl** format and **Album (LP)** to avoid CD or Single clutter.
- **Market Data:** Fetches real-time "Market Floor" pricing (Lowest Price) from the Discogs Marketplace.
- **Mint Condition Estimates:** Attempts to fetch suggested pricing for Mint (M) copies when available.
- **Smart Positioning:** Popup automatically renders above or below text based on available screen space.
- **Non-Intrusive:** Injects zero CSS into the host page until activated.

## 🔧 Installation (Developer Mode)

Since this extension is local (or pending Web Store approval), install it via Developer Mode:

1. Clone this repo.
2. Open Chrome and navigate to `chrome://extensions`.
3. Toggle **Developer mode** (top right switch).
4. Click **Load unpacked**.
5. Select the root folder of this project.

## ⚙️ Configuration

### Discogs API Token

The extension requires a Personal Access Token from Discogs to fetch pricing data.

1. Go to [Discogs Developer Settings](https://www.discogs.com/settings/developers).
2. Generate a new token.
3. Open `background.js` and replace the placeholder:
   ```javascript
   const DISCOGS_TOKEN = "YOUR_TOKEN_HERE";
   ```

## 📂 File Structure

- `manifest.json`: Chrome Extension config & permissions(`contextMenus`, `activeTab`, `scripting`).
- `background.js`: Handles the API logic (Search -> Get ID -> Get Price).
- `content.js`: Handles the UI injection (Floating Popup, Positioning, Animations).
- `icon.png`: Extension icon.

## 🔒 Privacy

This extension collects no user data. It only processes the text string specifically highlighted by the user to perform a search query via the Discogs API. No history is stored.
