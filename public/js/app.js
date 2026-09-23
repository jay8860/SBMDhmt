SD.screens = SD.screens || {};
SD.render = function () {
  document.documentElement.lang = window.LANG;
  if (!SD.S.token || !SD.S.user) {
    SD.stopScanner && SD.stopScanner();
    if (typeof SD.screens.login !== "function") {
      SD.appEl().innerHTML = "<div class='login'><p class='hint'>App failed to load. Refresh once.</p></div>";
      return;
    }
    return SD.screens.login();
  }
  if (SD.S.tab !== "scan" && SD.stopScanner) SD.stopScanner();
  const key = SD.S.tab || "home";
  const fn = SD.screens[key] || SD.screens.home;
  fn();
};
window.addEventListener("online", () => { SD.S.online = true; SD.renderStatus(); SD.sync(true); });
window.addEventListener("offline", () => { SD.S.online = false; SD.renderStatus(); });
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
}
SD.render();
if (SD.S.token) { SD.sync(true); setInterval(() => { if (navigator.onLine && SD.pendingCount()) SD.sync(true); }, 90000); }
