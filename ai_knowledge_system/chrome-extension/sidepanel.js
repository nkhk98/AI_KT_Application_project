function renderData(data) {

  console.log("📢 Rendering data:", data);

  // -------------------------
  // LOADING STATE
  // -------------------------

  if (data.loading) {

    document.getElementById("answer").innerHTML =
      "<h3>⏳ Analyzing Jira Ticket...</h3>";

    document.getElementById("confidence").innerHTML = "";

    document.getElementById("sources").innerHTML = "";

    return;
  }

  // -------------------------
  // CONFIDENCE VALUES
  // -------------------------

  const faith = data.confidence?.faithfulness || 0;
  const rel = data.confidence?.relevance || 0;
  const severity = data.severity || "Medium";
  const container =
    document.querySelector(".container");

    if (severity === "Critical") {

      container.style.borderLeft =
        "6px solid red";

    }
    else if (severity === "High") {

      container.style.borderLeft =
        "6px solid orange";

    }
    else if (severity === "Medium") {

      container.style.borderLeft =
        "6px solid yellow";

    }
    else {

      container.style.borderLeft =
        "6px solid green";
    }
  // -------------------------
  // CONFIDENCE STATUS
  // -------------------------

  let confidenceStatus = "";

  if (faith >= 0.7 && rel >= 0.7) {
    confidenceStatus = "🟢 High Confidence";
  }
  else if (faith >= 0.4 || rel >= 0.4) {
    confidenceStatus = "🟡 Medium Confidence";
  }
  else {
    confidenceStatus = "🔴 Low Confidence";
  }

  // -------------------------
  // ANSWER SECTION
  // -------------------------

  let finalAnswer = "";

  if (faith < 0.3 || rel < 0.3) {

    finalAnswer +=
      "⚠️ Documentation coverage is incomplete.<br>";

    finalAnswer +=
      "Please verify with module expert.<br><br>";
  }

  finalAnswer += data.answer || "No answer generated.";

  document.getElementById("answer").innerHTML =
  "<h3>📌 AI Analysis</h3>" +
  marked.parse(finalAnswer);

  // -------------------------
  // CONFIDENCE SECTION
  // -------------------------

  document.getElementById("confidence").innerHTML =
    `
    <b>${confidenceStatus}</b><br><br>
    Faithfulness: ${faith}<br>
    Relevance: ${rel}
    `;

  // -------------------------
  // SOURCES SECTION
  // -------------------------

  let sources = "<h3>📚 Related Modules</h3>";
  sources += '<div class="badge-container">';

  const modules = new Set();

  data.source_docs?.forEach(doc => {

    if (doc.metadata?.module) {
      modules.add(doc.metadata.module);
    }
  });

  if (modules.size === 0) {

    sources += "No reliable sources found";

  } else {

    modules.forEach(module => {

      sources += `
        <span class="badge">
          ${module}
        </span>
      `;
    });
  }

  sources += '</div>';

  document.getElementById("sources").innerHTML = sources;

  document.getElementById("confidence").innerHTML += `
    <br><br>
    ⏱ Response Time: ${data.response_time || "N/A"}s
    `;

  document.getElementById("copyBtn").addEventListener("click", () => {
    const text =
      document.getElementById("answer").innerText;
      navigator.clipboard.writeText(text);
    alert("Copied!");
  });

}

function loadLatestData() {

  chrome.storage.local.get("ai_response", (result) => {

    console.log("📦 STORAGE DATA:", result);

    if (result.ai_response) {
      renderData(result.ai_response);
    }
  });
}

// Initial load
loadLatestData();

// Real-time listener
chrome.storage.onChanged.addListener((changes, area) => {

  console.log("🔄 STORAGE CHANGED:", changes);

  if (area === "local" && changes.ai_response) {

    renderData(changes.ai_response.newValue);
  }
});

// Fallback polling
setInterval(loadLatestData, 3000);