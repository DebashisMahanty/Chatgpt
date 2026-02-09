const WINDOW_ID_KEY = "floatingWindowId";

async function openFloatingWindow() {
  const existing = await chrome.storage.session.get(WINDOW_ID_KEY);
  const windowId = existing[WINDOW_ID_KEY];

  if (windowId) {
    try {
      await chrome.windows.update(windowId, { focused: true });
      return;
    } catch (error) {
      await chrome.storage.session.remove(WINDOW_ID_KEY);
    }
  }

  const popupWindow = await chrome.windows.create({
    url: "window.html",
    type: "popup",
    width: 420,
    height: 620,
    focused: true
  });

  if (popupWindow?.id) {
    await chrome.storage.session.set({ [WINDOW_ID_KEY]: popupWindow.id });
  }
}

chrome.action.onClicked.addListener(() => {
  openFloatingWindow();
});

chrome.windows.onRemoved.addListener(async (windowId) => {
  const existing = await chrome.storage.session.get(WINDOW_ID_KEY);
  if (existing[WINDOW_ID_KEY] === windowId) {
    await chrome.storage.session.remove(WINDOW_ID_KEY);
  }
});
