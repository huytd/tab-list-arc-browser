(function () {
  const container = document.createElement("div");
  container.id = "tab-list-container";
  container.className = "hidden";
  document.body.prepend(container);

  async function updateTabList(tabs) {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
      return;
    }

    container.innerHTML = "";
    const list = document.createElement("ul");
    let index = 0;
    tabs.forEach((tab) => {
      index++;
      const listItem = document.createElement("li");
      let tabTitleLength = tab.title.length;
      let tabTitle =
        tabTitleLength <= 30 ? tab.title : `${tab.title.substr(0, 30)}...`;
      listItem.textContent = index + ". " + tabTitle;
      if (tab.active) {
        listItem.className = "active";
      }
      listItem.setAttribute("data-tabid", tab.id);
      listItem.addEventListener("click", () => {
        try {
          chrome.runtime.sendMessage(
            { action: "navigateToTab", tabId: tab.id },
            (response) => {
              if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError);
              }
              document.querySelector(`[data-tabid=${tab.id}]`).scrollIntoView();
            },
          );
        } catch (error) {
          console.error("Error sending message to navigate to tab:", error);
        }
      });
      list.appendChild(listItem);
    });
    container.appendChild(list);
  }

  function fetchTabs() {
    if (chrome.runtime?.id) {
      try {
        chrome.storage.local.get(["tabsList"], async (result) => {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
            return;
          }
          if (result.tabsList) {
            updateTabList(result.tabsList);
          }
        });
      } catch (error) {
        console.error("Error fetching tabs:", error);
      }
    }
  }

  fetchTabs();

  document.addEventListener("keyup", (event) => {
    if (event.key === "Meta") {
      container.className = "hidden";
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.metaKey) {
      container.className = "";
    }
    if (event.metaKey && event.key >= "1" && event.key <= "9") {
      const tabIndex = event.key === "9" ? -1 : parseInt(event.key, 10) - 1;
      chrome.runtime.sendMessage({ action: "switchToTab", tabIndex }, () => {
        document.querySelector(`[data-tabid=${tab.id}]`).scrollIntoView();
      });
    }
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message.messageType === "update") {
      fetchTabs();
    }
  });
})();
