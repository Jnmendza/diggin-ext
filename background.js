chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "search-vinyl",
    title: "Search Vinyl for '%s'",
    contexts: ["selection"],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "search-vinyl") {
    const rawQuery = info.selectionText;
    const query = rawQuery.replace(/[^\w\s]/gi, "").trim();

    if (query.length > 80 || query.length < 2) return;

    const DISCOGS_TOKEN = "OHHCaJecQXxHImiXVZGKsXlbWpRAqwmPGVxEowpF";

    fetch(
      `https://api.discogs.com/database/search?q=${encodeURIComponent(query)}&type=release&format=LP&token=${DISCOGS_TOKEN}`,
    )
      .then((response) => response.json())
      .then((data) => {
        if (data.results && data.results.length > 0) {
          const topResult = data.results[0];

          if (isResultRelevant(query, topResult.title)) {
            fetch(
              `https://api.discogs.com/marketplace/stats/${topResult.id}?curr_abbr=USD&token=${DISCOGS_TOKEN}`,
            )
              .then((res) => res.json())
              .then((priceData) => {
                let priceString = "N/A";
                if (priceData.lowest_price && priceData.lowest_price.value) {
                  const val = Math.ceil(priceData.lowest_price.value);
                  priceString = `$${val}+`;
                }

                // --- SUCCESS: INJECT THEN SHOW ---
                injectAndSendMessage(tab.id, {
                  action: "SHOW_POPUP",
                  data: {
                    title: topResult.title,
                    image: topResult.thumb || "",
                    year: topResult.year || "Unknown",
                    label: topResult.label ? topResult.label[0] : "",
                    country: topResult.country || "",
                    genre: topResult.genre ? topResult.genre[0] : "",
                    style: topResult.style ? topResult.style[0] : "",
                    query: rawQuery,
                    price: priceString,
                  },
                });
              })
              .catch((err) => {
                // --- ERROR FETCHING PRICE: INJECT THEN SHOW ---
                injectAndSendMessage(tab.id, {
                  action: "SHOW_POPUP",
                  data: {
                    title: topResult.title,
                    image: topResult.thumb || "",
                    year: topResult.year || "Unknown",
                    label: topResult.label ? topResult.label[0] : "",
                    country: topResult.country || "",
                    genre: topResult.genre ? topResult.genre[0] : "",
                    style: topResult.style ? topResult.style[0] : "",
                    query: rawQuery,
                    price: "N/A",
                  },
                });
              });
          } else {
            // --- IRRELEVANT: INJECT THEN SHOW ---
            injectAndSendMessage(tab.id, {
              action: "NO_RESULTS",
              query: rawQuery,
            });
          }
        } else {
          // --- NO RESULTS: INJECT THEN SHOW ---
          injectAndSendMessage(tab.id, {
            action: "NO_RESULTS",
            query: rawQuery,
          });
        }
      })
      .catch((err) => console.error("Discogs API Error:", err));
  }
});

// --- HELPER FUNCTION TO INJECT SCRIPT ---
function injectAndSendMessage(tabId, message) {
  // 1. Inject the content script
  chrome.scripting.executeScript(
    {
      target: { tabId: tabId },
      files: ["content.js"],
    },
    () => {
      // 2. Check for errors (e.g., user is on a chrome:// page)
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
        return;
      }
      // 3. Send the message now that the script is there
      chrome.tabs.sendMessage(tabId, message);
    },
  );
}

function isResultRelevant(userQuery, resultTitle) {
  const queryWords = userQuery.toLowerCase().split(/\s+/);
  const titleLower = resultTitle.toLowerCase();
  const ignoreList = [
    "the",
    "and",
    "or",
    "a",
    "an",
    "of",
    "in",
    "by",
    "vol",
    "ep",
    "lp",
    "vinyl",
  ];
  const significantWords = queryWords.filter(
    (w) => w.length > 2 && !ignoreList.includes(w),
  );
  if (significantWords.length === 0) return false;
  return significantWords.some((word) => titleLower.includes(word));
}
