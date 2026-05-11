
console.log("TEST CONTENT SCRIPT");
console.log("🚀 Service worker started");
chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
  if (msg.type === "PROCESS_JIRA") {
    
    chrome.storage.local.set({
        ai_response: {
          loading: true
        }
      });

    const title = msg.data?.title || "";
    const description = msg.data?.description || "";
    const query = `${title}\n${description}`;
    
    const start = Date.now();  
    try {

      const res = await fetch(
        "http://127.0.0.1:3000/query",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ query })
        }
      );

      const result = await res.json();

      console.log("🔥 AI RESULT:", result);

      const end = Date.now();

      result.response_time =
        ((end - start) / 1000).toFixed(2);

      // Store AFTER updating object
      chrome.storage.local.set({
        ai_response: result
      });

      console.log("✅ Stored AI response");

    } catch (err) {

      console.error("❌ Backend error:", err);
    }
  }
});

chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});
