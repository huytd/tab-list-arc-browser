chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === "navigateToTab") {
    try {
      chrome.tabs.update(request.tabId, { active: true }, () => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
        }
      });
    } catch (error) {
      console.error("Error navigating to tab:", error);
    }
  } else if (request.action === "switchToTab") {
    try {
      chrome.tabs.query({}, (tabs) => {
        const tabIndex =
          request.tabIndex === -1 ? tabs.length - 1 : request.tabIndex;
        if (tabs[tabIndex]) {
          chrome.tabs.update(tabs[tabIndex].id, { active: true }, () => {
            if (chrome.runtime.lastError) {
              console.error(chrome.runtime.lastError);
            }
          });
        }
      });
    } catch (error) {
      console.error("Error switching to tab:", error);
    }
  }
});

function updateTabsList() {
  try {
    chrome.tabs.query({}, (tabs) => {
      chrome.storage.local.set({ tabsList: tabs }, () => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
        }
        tabs.forEach((tab) => {
          console.log("MSG TAB", tab);
          chrome.tabs.sendMessage(tab.id, { messageType: "update" });
        });
      });
    });
  } catch (error) {
    console.error("Error updating tabs list:", error);
  }
}

chrome.tabs.onUpdated.addListener(() => {
  updateTabsList();
});

chrome.tabs.onRemoved.addListener(() => {
  updateTabsList();
});

chrome.tabs.onCreated.addListener(() => {
  updateTabsList();
});

chrome.tabs.onMoved.addListener(() => {
  updateTabsList();
});

chrome.tabs.onActivated.addListener(() => {
  updateTabsList();
});
