function getJiraData() {
  const title = document.querySelector(
    '[data-testid="issue.views.issue-base.foundation.summary.heading"]'
  )?.innerText;

  const description = document.querySelector(
    '[data-testid="issue.views.field.rich-text.description"]'
  )?.innerText;

  return { title, description };
}

console.log("📄 Content script loaded");

const title = document.querySelector('[data-testid="issue.views.issue-base.foundation.summary.heading"]')?.innerText;
const description = document.querySelector('[data-testid="issue.views.field.rich-text.description"]')?.innerText;

console.log("🧾 Extracted:", title, description);

chrome.runtime.sendMessage({
  type: "PROCESS_JIRA",
  data: {
    title,
    description
  }
});

// Send to background after page loads
setTimeout(() => {
  const data = getJiraData();

  if (data.title) {
    chrome.runtime.sendMessage({
      type: "PROCESS_JIRA",
      data: data
    });
  }
}, 3000);


