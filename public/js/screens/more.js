SD.screens.more = function () {
  const n = SD.pendingCount();
  const notes = (SD.S.data.notifications || []).filter((x) => !x.read_at);
  SD.shell(`${SD.statusHTML()}<div class="card"><h3>${SD.esc(SD.S.user.name)}<span class="r">${SD.esc(SD.roleLabel(SD.S.user.role))}</span></h3>
    <div class="s" style="font-size:12.5px;color:var(--ink2)">📞 ${SD.esc(SD.S.user.phone)}</div></div>
    <div class="card"><h3>⚙️ ${SD.esc(t("settings"))}</h3><div class="list">
      ${SD.isField(SD.S.user) ? `<div class="item" id="mDir"><div class="av">🏛</div><div class="bd"><div class="t">${SD.esc(t("directory"))}</div></div><span>›</span></div>` : `<div class="item" id="mUsers"><div class="av">👥</div><div class="bd"><div class="t">${SD.esc(t("users"))}</div></div><span>›</span></div>`}
      ${SD.isField(SD.S.user) ? `<div class="item" id="mReports"><div class="av">⬇️</div><div class="bd"><div class="t">${SD.esc(t("export"))}</div></div><span>›</span></div>` : ""}
      <div class="item" id="mNotes"><div class="av">🔔</div><div class="bd"><div class="t">${SD.esc(t("notifications"))}</div><div class="s">${notes.length}</div></div><span>›</span></div>
      ${["admin", "state_admin", "supervisor"].includes(SD.S.user.role) ? `<div class="item" id="mAudit"><div class="av">📜</div><div class="bd"><div class="t">${SD.esc(t("audit"))}</div></div><span>›</span></div>` : ""}
      <div class="item" id="mLang"><div class="av">🌐</div><div class="bd"><div class="t">${SD.esc(t("language"))}</div></div><span>›</span></div>
      <div class="item" id="mPin"><div class="av">🔒</div><div class="bd"><div class="t">${SD.esc(t("change_pin"))}</div></div><span>›</span></div>
      <div class="item" id="mSync"><div class="av">⟳</div><div class="bd"><div class="t">${SD.esc(t("sync_now"))}</div><div class="s">${n ? SD.esc(t("pending_sync", { n })) : SD.esc(t("online"))}</div></div><span>›</span></div>
    </div>
    <div style="height:14px"></div><button class="btn danger" id="mOut">${SD.esc(t("logout"))}</button></div>`);
  if (SD.$("#mDir")) SD.$("#mDir").onclick = () => { SD.S.tab = "directory"; SD.render(); };
  if (SD.$("#mUsers")) SD.$("#mUsers").onclick = () => SD.screens.users();
  if (SD.$("#mReports")) SD.$("#mReports").onclick = () => { SD.S.tab = "reports"; SD.render(); };
  SD.$("#mNotes").onclick = () => {
    SD.sheet(t("notifications"), `<div class="list">${(SD.S.data.notifications || []).map((n) => `<div class="item" data-n="${n.id}"><div class="bd"><div class="t">${SD.esc(n.title)}</div><div class="s">${SD.esc(n.body || "")} · ${SD.dmy(n.ts)}</div></div></div>`).join("") || `<div class="empty">${SD.esc(t("no_data"))}</div>`}</div>`, () => {
      document.querySelectorAll("[data-n]").forEach((el) => (el.onclick = async () => {
        try {
          await SD.api("/api/notifications/" + el.dataset.n + "/read", { method: "POST" });
          const rec = (SD.S.data.notifications || []).find((x) => x.id === el.dataset.n);
          if (rec) rec.read_at = SD.nowISO();
          el.style.opacity = "0.55";
        } catch (_) {}
      }));
    });
  };
  if (SD.$("#mAudit")) SD.$("#mAudit").onclick = async () => {
    try {
      const rows = await SD.api("/api/audit-logs");
      SD.sheet(t("audit"), `<div class="list">${rows.map((a) => `<div class="item" style="cursor:default"><div class="bd"><div class="t">${SD.esc(a.action)} ${SD.esc(a.table_name)}</div><div class="s">${SD.esc(a.actor_name || "")} · ${SD.dmy(a.ts)}${a.detail ? " · " + SD.esc(a.detail) : ""}${a.row_id ? " · " + SD.esc(a.row_id) : ""}</div></div></div>`).join("") || `<div class="empty">${SD.esc(t("no_data"))}</div>`}</div>`);
    } catch (e) { SD.toast(e.message); }
  };
  SD.$("#mLang").onclick = () => { window.LANG = window.LANG === "hi" ? "en" : "hi"; localStorage.setItem("lang", window.LANG); SD.render(); };
  SD.$("#mSync").onclick = () => SD.sync(false);
  SD.$("#mPin").onclick = () => SD.sheet(t("change_pin"), `<form id="pf"><input name="pin" required minlength="4" maxlength="6"><button class="btn" type="submit">${SD.esc(t("save"))}</button></form>`, () => {
    SD.$("#pf").onsubmit = async (e) => { e.preventDefault(); try { await SD.api("/api/me/pin", { method: "POST", body: JSON.stringify({ pin: new FormData(e.target).get("pin") }) }); SD.closeSheet(); SD.toast(t("pin_changed")); } catch (err) { SD.toast(err.message); } };
  });
  SD.$("#mOut").onclick = () => { if (confirm(t("confirm_logout"))) SD.doLogout(); };
};
SD.doLogout = function (silent) {
  if (!silent && SD.S.token) SD.api("/api/logout", { method: "POST" }).catch(() => {});
  SD.S.token = null; SD.S.user = null; SD.save.auth();
  localStorage.removeItem(SD.LS.data); localStorage.removeItem(SD.LS.outbox);
  SD.S.data = SD.emptyData(); SD.S.outbox = SD.emptyOutbox();
  SD.render();
};
