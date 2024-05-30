const formEl = document.getElementById("options-form");
formEl.addEventListener("submit", (e) => {
  e.preventDefault();
  const formData = new FormData(formEl);
  const theme = formData.get("theme");
  console.log("AUTO HIDE", formData.get("autoHideMode"));
  const autoHideMode = formData.get("autoHideMode") === "on";
  chrome.storage.sync.set(
    {
      theme,
      autoHideMode,
    },
    () => {
      console.log("Options saved!");
    },
  );
});

window.onload = function () {
  chrome.storage.sync.get(function (options) {
    formEl["theme"].value = options.theme;
    formEl["autoHideMode"].checked = options.autoHideMode;
  });
};
