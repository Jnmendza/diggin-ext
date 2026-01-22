if (!window.hasDigginRun) {
  window.hasDigginRun = true;

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "SHOW_POPUP") {
      showFloatingPopup(request.data);
    } else if (request.action === "NO_RESULTS") {
      showErrorPopup(request.query);
    }
  });

  function showFloatingPopup(data) {
    removeExistingPopup();

    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    const rect = selection.getRangeAt(0).getBoundingClientRect();

    const modal = document.createElement("div");
    modal.id = "vs-modal";

    modal.style.cssText = `
    position: absolute; 
    visibility: hidden; 
    width: 320px; 
    background: #1a1a1a; 
    color: #fff; 
    border-radius: 12px;
    padding: 16px; 
    border: 1px solid #333;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    box-shadow: 0 20px 50px rgba(0,0,0,0.7);
    z-index: 2147483647;
  `;

    // Inject Styles (Button & Animations)
    const style = document.createElement("style");
    style.textContent = `
    @keyframes vs-fade-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes vs-fade-down { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
    
    .vs-tag { 
      background: #333; padding: 3px 6px; border-radius: 4px; 
      font-size: 10px; color: #ccc; margin-right: 4px; font-weight: 600; 
    }
    .vs-primary-btn {
      flex: 1.5; background: #ffffff; color: #000000; border: none; padding: 12px;
      border-radius: 6px; font-weight: 800; font-size: 13px; cursor: pointer;
      text-transform: uppercase; border-bottom: 4px solid #cccccc;
      transition: all 0.15s ease-out;
    }
    .vs-primary-btn:hover {
      background: #f5df2e; border-bottom-color: #bfae24; transform: translateY(-2px);
    }
    .vs-primary-btn:active {
      transform: translateY(2px); border-bottom-width: 0px; margin-top: 4px;
    }
  `;
    if (!document.getElementById("vs-styles")) {
      style.id = "vs-styles";
      document.head.appendChild(style);
    }

    // HTML Content
    const genreTag = data.genre
      ? `<span class="vs-tag">${data.genre}</span>`
      : "";
    const countryTag = data.country
      ? `<span class="vs-tag">${data.country}</span>`
      : "";

    modal.innerHTML = `
    <div style="display:flex; justify-content:space-between; margin-bottom:12px; border-bottom:1px solid #333; padding-bottom:8px;">
        <span style="font-size:10px; color:#f5df2e; font-weight:900; letter-spacing:1px; text-transform:uppercase;">Diggin Match</span>
        <div id="vs-close" style="cursor:pointer; color:#666; font-size:16px; line-height:10px;">✕</div>
    </div>
    
    <div style="display:flex; gap: 14px; align-items: start; margin-bottom: 16px;">
       <img src="${data.image}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 6px; background:#222; border:1px solid #333;">
       <div style="flex:1; min-width:0;">
         <h4 style="margin: 0 0 4px 0; font-size: 15px; font-weight: 800; line-height: 1.2;">${truncate(data.title, 45)}</h4>
         <p style="margin: 0 0 8px 0; font-size: 12px; color: #999;">${data.year} • ${truncate(data.label, 15)}</p>
         <div style="display:flex; flex-wrap:wrap; gap:2px;">
            ${genreTag} ${countryTag}
         </div>
       </div>
    </div>

    <div style="display: flex; gap: 10px; align-items: center;">
        <div style="flex: 1;">
             <p style="margin:0; font-size: 10px; color: #888; text-transform:uppercase; font-weight:bold;">Market Floor</p>
             <p style="margin:0; font-size: 18px; color: #f5df2e; font-weight: 900;">${data.price || "N/A"}</p>
        </div>
        <button id="vs-go-diggin" class="vs-primary-btn">Go Diggin ➝</button>
    </div>
  `;

    document.body.appendChild(modal);

    // --- 2. CALCULATE POSITION ---
    const modalHeight = modal.offsetHeight;
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    let topPos, animationName;

    // LOGIC: If there isn't enough space below (approx 220px) AND there IS space above, flip it.
    if (spaceBelow < modalHeight + 20 && spaceAbove > modalHeight + 20) {
      // Position ABOVE
      topPos = rect.top + window.scrollY - modalHeight - 12;
      animationName = "vs-fade-up"; // Animate upwards
    } else {
      // Position BELOW (Default)
      topPos = rect.bottom + window.scrollY + 12;
      animationName = "vs-fade-down"; // Animate downwards
    }

    // --- 3. APPLY FINAL STYLES ---
    modal.style.top = `${topPos}px`;
    modal.style.left = `${rect.left + window.scrollX}px`;
    modal.style.visibility = "visible";
    modal.style.animation = `${animationName} 0.2s ease-out`;

    // Listeners
    document.getElementById("vs-close").onclick = removeExistingPopup;
    document.getElementById("vs-go-diggin").onclick = () => {
      const searchUrl = `https://www.discogs.com/sell/list?q=${encodeURIComponent(data.title)}&format=Vinyl&condition=Mint+(M)&item_location=US`;
      window.open(searchUrl, "_blank");
      removeExistingPopup();
    };

    setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);
  }

  function showErrorPopup(query) {
    removeExistingPopup();
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    const rect = selection.getRangeAt(0).getBoundingClientRect();

    const msg = document.createElement("div");
    msg.id = "vs-modal";

    // Simple check for error popup too
    const spaceBelow = window.innerHeight - rect.bottom;
    let topPos =
      spaceBelow < 50
        ? rect.top + window.scrollY - 40
        : rect.bottom + window.scrollY + 8;

    msg.style.cssText = `
    position: absolute; top: ${topPos}px; left: ${rect.left + window.scrollX}px;
    z-index: 2147483647; background: #222; color: #fff; padding: 8px 12px; border-radius: 6px;
    font-size: 12px; font-family: sans-serif; font-weight: 600; border: 1px solid #333;
    box-shadow: 0 4px 10px rgba(0,0,0,0.3); pointer-events: none;
  `;
    msg.innerHTML = `<span style="color:#f5df2e">✕</span> No vinyl found for "${truncate(query, 15)}"`;
    document.body.appendChild(msg);
    setTimeout(removeExistingPopup, 2000);
  }

  function removeExistingPopup() {
    const existing = document.getElementById("vs-modal");
    if (existing) existing.remove();
    document.removeEventListener("mousedown", handleClickOutside);
  }

  function handleClickOutside(e) {
    const modal = document.getElementById("vs-modal");
    if (modal && !modal.contains(e.target)) {
      removeExistingPopup();
    }
  }

  function truncate(str, n) {
    return str && str.length > n ? str.substr(0, n - 1) + "..." : str || "";
  }
}
