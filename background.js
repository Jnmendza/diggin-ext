chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "search-vinyl",
    title: "Search Vinyl for '%s'",
    contexts: ["selection"],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "search-vinyl") {
    // 1. Clean the query
    const rawQuery = info.selectionText;
    const query = rawQuery.replace(/[^\w\s]/gi, "").trim();

    if (query.length > 80 || query.length < 2) return;

    // REPLACE WITH YOUR TOKEN
    const DISCOGS_TOKEN = "OHHCaJecQXxHImiXVZGKsXlbWpRAqwmPGVxEowpF";

    // 2. THE FIX: Add '&format=LP' to exclude Singles/EPs
    // This helps ensure the "Lowest Price" is actually for a full album.
    fetch(
      `https://api.discogs.com/database/search?q=${encodeURIComponent(query)}&type=release&format=LP&token=${DISCOGS_TOKEN}`,
    )
      .then((response) => response.json())
      .then((data) => {
        if (data.results && data.results.length > 0) {
          const topResult = data.results[0];

          if (isResultRelevant(query, topResult.title)) {
            // 3. Use 'marketplace/stats' because it works for MASTERS
            // (Price Suggestions fails on Masters, causing N/A)
            fetch(
              `https://api.discogs.com/marketplace/stats/${topResult.id}?curr_abbr=USD&token=${DISCOGS_TOKEN}`,
            )
              .then((res) => res.json())
              .then((priceData) => {
                let priceString = "N/A";

                // 4. Get the Lowest Price (Floor Price)
                if (priceData.lowest_price && priceData.lowest_price.value) {
                  // Round it to make it look cleaner
                  const val = Math.ceil(priceData.lowest_price.value);
                  priceString = `$${val}+`; // Add '+' to imply "Starting at"
                }

                chrome.tabs.sendMessage(tab.id, {
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
                // If price fails, show popup anyway
                chrome.tabs.sendMessage(tab.id, {
                  action: "SHOW_POPUP",
                  data: {
                    title: topResult.title,
                    image: topResult.thumb || "",
                    year: topResult.year || "Unknown",
                    label: topResult.label ? topResult.label[0] : "",
                    // ... pass other data ...
                    query: rawQuery,
                    price: "N/A",
                  },
                });
              });
          } else {
            chrome.tabs.sendMessage(tab.id, {
              action: "NO_RESULTS",
              query: rawQuery,
            });
          }
        } else {
          chrome.tabs.sendMessage(tab.id, {
            action: "NO_RESULTS",
            query: rawQuery,
          });
        }
      })
      .catch((err) => console.error("Discogs API Error:", err));
  }
});

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
