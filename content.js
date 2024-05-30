(async function () {
  const options = await chrome.storage.sync.get();
  const configuredTheme = options.theme ?? "system";
  const isAutoHide = options.autoHideMode || false;

  const tabListHeight = 32;
  const matchMedia = window.matchMedia("(prefers-color-scheme: dark)");
  const isDarkTheme = (() => {
    switch (configuredTheme) {
      case "light":
        return false;
      case "dark":
        return true;
      default:
        return matchMedia?.matches ? true : false;
    }
  })();

  if (configuredTheme === "system") {
    matchMedia.addEventListener("change", (e) => {
      const isDarkTheme = matchMedia?.matches ? true : false;
      container.className = isDarkTheme ? "dark" : "light";
    });
  }

  const container = document.createElement("div");
  container.id = "tab-list-container";
  container.className = isDarkTheme ? "dark" : "light";
  if (isAutoHide) {
    container.setAttribute("data-hidden", true);
  }
  document.body.prepend(container);

  if (!isAutoHide) {
    document.body.style.paddingTop = `${tabListHeight}px`;

    const fixedElements = document.querySelectorAll("*");
    fixedElements.forEach((el) => {
      if (el.id === "tab-list-container") return;
      const computedStyle = window.getComputedStyle(el);
      const top = parseInt(computedStyle.top, 10);
      if (isNaN(top)) {
        return;
      }
      if (computedStyle.position === "fixed") {
        el.style.top = `${top + tabListHeight}px`;
      }
      if (computedStyle.position === "sticky") {
        if (top === 0) {
          el.style.top = `${tabListHeight}px`;
        }
      }
    });
  }

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

  if (isAutoHide) {
    document.addEventListener("keyup", (event) => {
      if (event.key === "Meta") {
        container.setAttribute("data-hidden", true);
      }
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.metaKey && isAutoHide) {
      chrome.runtime.sendMessage({ action: "showTabList" });
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
    if (message.messageType === "showTabList") {
      container.removeAttribute("data-hidden");
    }
  });
})();
