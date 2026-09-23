SD.screens.login = function () {
  SD.appEl().innerHTML = `<div class="login"><div class="box">
    <div class="logo"><img src="/icons/icon.svg" alt=""><h2>${SD.esc(t("app"))}</h2><p class="t">${SD.esc(t("app_sub"))}</p></div>
    <form id="lf">
      <label>${SD.esc(t("phone"))}</label><input name="phone" type="tel" inputmode="numeric" required>
      <label>${SD.esc(t("pin"))}</label><input name="pin" type="password" inputmode="numeric" required>
      <div style="height:16px"></div><button class="btn" type="submit">${SD.esc(t("signin"))}</button>
      <p class="hint" style="text-align:center;margin-top:12px">${SD.esc(t("login_hint"))}</p>
    </form>
    <div style="text-align:center;margin-top:10px"><button class="btn sm gray" id="langToggle">${window.LANG === "hi" ? "English" : "हिन्दी"}</button></div>
  </div></div>`;
  SD.$("#langToggle").onclick = () => { window.LANG = window.LANG === "hi" ? "en" : "hi"; localStorage.setItem("lang", window.LANG); SD.render(); };
  SD.$("#lf").onsubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const btn = SD.$("#lf button[type=submit]"); btn.disabled = true;
    try {
      const r = await SD.api("/api/login", { method: "POST", body: JSON.stringify({ phone: f.get("phone"), pin: f.get("pin") }) });
      SD.S.token = r.token; SD.S.user = r.user;
      if (r.assignments) SD.S.data.assignments = r.assignments;
      SD.save.auth();
      await SD.bootstrap(); SD.S.tab = "home"; SD.render();
    } catch (err) { SD.toast(t("bad_login")); btn.disabled = false; }
  };
};
