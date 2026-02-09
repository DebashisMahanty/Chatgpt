const apiKeyInput = document.getElementById("apiKey");
const saveButton = document.getElementById("save");
const statusEl = document.getElementById("status");

async function loadSettings() {
  const result = await chrome.storage.sync.get("openaiApiKey");
  if (result.openaiApiKey) {
    apiKeyInput.value = result.openaiApiKey;
  }
}

async function saveSettings() {
  const openaiApiKey = apiKeyInput.value.trim();
  await chrome.storage.sync.set({ openaiApiKey });
  statusEl.textContent = "Saved!";
  setTimeout(() => {
    statusEl.textContent = "";
  }, 2000);
}

saveButton.addEventListener("click", saveSettings);

loadSettings();
