SD.$ = (sel, root) => (root || document).querySelector(sel);
SD.appEl = () => document.getElementById("app");
SD.esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
SD.uuid = () => (crypto.randomUUID ? crypto.randomUUID() : "x" + Date.now() + Math.random().toString(16).slice(2));
SD.todayStr = () => new Date().toISOString().slice(0, 10);
SD.nowISO = () => new Date().toISOString();
SD.hhmm = (iso) => (iso ? new Date(iso).toLocaleTimeString(window.LANG === "hi" ? "hi-IN" : "en-IN", { hour: "2-digit", minute: "2-digit" }) : "");
SD.dmy = (iso) => (iso ? new Date(iso).toLocaleDateString(window.LANG === "hi" ? "hi-IN" : "en-IN", { day: "2-digit", month: "short" }) : "");
SD.inr = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
SD.num = (v) => (v === "" || v == null ? 0 : Number(v) || 0);
SD.toast = function (msg, ms) {
  let el = document.getElementById("toast");
  if (el) el.remove();
  el = document.createElement("div");
  el.id = "toast"; el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), ms || 2600);
};
SD.closeSheet = function () { const s = document.getElementById("sheet"); if (s) s.remove(); };
window.closeSheet = SD.closeSheet;
SD.sheet = function (title, innerHTML, onMount) {
  SD.closeSheet();
  const d = document.createElement("div");
  d.className = "sheet"; d.id = "sheet";
  d.innerHTML = `<div class="inner"><div class="grab"></div><h2>${SD.esc(title)}</h2><div id="sheetBody">${innerHTML}</div></div>`;
  d.addEventListener("click", (e) => { if (e.target === d) SD.closeSheet(); });
  document.body.appendChild(d);
  if (onMount) onMount(d);
  return d;
};
SD.statusHTML = function () {
  const n = SD.pendingCount();
  if (!navigator.onLine) return `<div class="statusbar off"><span class="dot"></span>${SD.esc(t("offline"))}${n ? " · " + n : ""}</div>`;
  if (SD.S.syncing) return `<div class="statusbar pend"><span class="dot"></span>${SD.esc(t("syncing"))}</div>`;
  if (n) return `<div class="statusbar pend"><span class="dot"></span>${SD.esc(t("pending_sync", { n }))}</div>`;
  return `<div class="statusbar ok"><span class="dot"></span>${SD.esc(t("online"))}</div>`;
};
SD.renderStatus = function () { const s = SD.$("#main .statusbar"); if (s) s.outerHTML = SD.statusHTML(); };
SD.navTabs = function () {
  if (SD.isField(SD.S.user)) {
    return [
      { k: "home", i: "🏠", l: t("home") }, { k: "scan", i: "📷", l: t("scan") },
      { k: "houses", i: "📋", l: t("houses") }, { k: "field", i: "📣", l: t("field") },
      { k: "more", i: "⋯", l: t("more") },
    ];
  }
  return [
    { k: "home", i: "📊", l: t("dashboard") }, { k: "directory", i: "🏛", l: t("directory") },
    { k: "swm", i: "🗑", l: t("swm") }, { k: "reports", i: "⬇️", l: t("reports") },
    { k: "more", i: "⋯", l: t("more") },
  ];
};
SD.shell = function (body) {
  const tabs = SD.navTabs();
  SD.appEl().innerHTML = `
    <div class="appbar">
      <img src="/icons/icon.svg" width="30" height="30" alt="">
      <h1>${SD.esc(t("app"))}<span class="sub">${SD.esc(SD.S.user.name)} · ${SD.esc(SD.roleLabel(SD.S.user.role))}</span></h1>
      <button class="iconbtn" id="btnSync">⟳</button>
    </div>
    <main id="main">${body}</main>
    <nav class="nav">${tabs.map((x) => `<button data-tab="${x.k}" class="${SD.S.tab === x.k ? "on" : ""}"><span class="ic">${x.i}</span><span>${SD.esc(x.l)}</span></button>`).join("")}</nav>`;
  SD.$("#btnSync").onclick = () => SD.sync(false);
  SD.appEl().querySelectorAll(".nav button").forEach((b) => (b.onclick = () => { SD.S.tab = b.dataset.tab; localStorage.setItem(SD.LS.tab, SD.S.tab); SD.render(); }));
};
SD.item = (title, sub, tag, extra) => `<div class="item" ${extra || ""}><div class="av">${SD.esc((title || "?").toString().slice(0, 1))}</div><div class="bd"><div class="t">${SD.esc(title)}</div><div class="s">${SD.esc(sub || "")}</div></div>${tag || ""}<span style="color:var(--ink3)">›</span></div>`;
SD.wardSelect = (name, selected) => `<select name="${name}" id="${name === "ward_id" ? "wardSel" : name}">${SD.visibleWards().map((w) => `<option value="${w.id}" ${selected === w.id ? "selected" : ""}>${SD.esc(window.LANG === "hi" ? w.name_hi : w.name_en)}</option>`).join("")}</select>`;
SD.villageSelect = function (name, wardId, selected) {
  const list = (SD.S.data.villages || []).filter((v) => !wardId || v.ward_id === wardId);
  return `<select name="${name}" id="vilSel"><option value="">—</option>${list.map((v) => `<option value="${v.id}" ${selected === v.id ? "selected" : ""}>${SD.esc(window.LANG === "hi" ? v.name_hi : v.name_en)}</option>`).join("")}</select>`;
};
SD.bindPhoto = (inputId, previewId, setter) => {
  const inp = SD.$(inputId); if (!inp) return;
  inp.onchange = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    const photo = await SD.compressImage(f, 680);
    setter(photo);
    const p = SD.$(previewId); if (p) p.innerHTML = photo ? `<img src="${photo}" style="width:100%;border-radius:10px;margin-top:8px">` : "";
  };
};
SD.facilityForm = function (table, rec, extraFields) {
  let photo = rec && rec.photo, gps = rec && rec.lat ? { lat: rec.lat, lng: rec.lng } : null;
  const startWard = (rec && rec.ward_id) || SD.myWardId();
  SD.sheet(rec ? t("edit") : t("add"), `<form id="ff">
    <label>${SD.esc(t("name"))}</label><input name="name" required value="${SD.esc(rec ? rec.name : "")}">
    <label>${SD.esc(t("ward"))}</label>${SD.wardSelect("ward_id", startWard)}
    <label>${SD.esc(t("village"))}</label>${SD.villageSelect("village_id", startWard, rec && rec.village_id)}
    ${extraFields || ""}
    <div class="row"><div><label>${SD.esc(t("toilets_total"))}</label><input name="toilets_total" type="number" min="0" value="${rec ? rec.toilets_total || 0 : 0}"></div>
      <div><label>${SD.esc(t("toilets_fn"))}</label><input name="toilets_functional" type="number" min="0" value="${rec ? rec.toilets_functional || 0 : 0}"></div></div>
    <label>${SD.esc(t("toilets_nf"))}</label><input name="toilets_non_functional" type="number" min="0" value="${rec ? rec.toilets_non_functional || 0 : 0}">
    <label>${SD.esc(t("notes"))}</label><textarea name="notes">${SD.esc(rec ? rec.notes || "" : "")}</textarea>
    <label>${SD.esc(t("photo"))}</label><input type="file" accept="image/*" capture="environment" id="fPhoto"><div id="fPrev">${rec && rec.photo ? `<img src="${rec.photo}" style="width:100%;border-radius:10px">` : ""}</div>
    <div class="hint" id="fGps">${SD.esc(t("gps_capturing"))}</div>
    <button class="btn" type="submit">${SD.esc(t("save"))}</button></form>`, () => {
    const wardEl = SD.$("#wardSel");
    if (wardEl) wardEl.onchange = () => {
      const wrap = SD.$("#vilSel");
      if (wrap) wrap.outerHTML = SD.villageSelect("village_id", wardEl.value, "");
    };
    SD.getGPS().then((g) => { if (g) gps = g; const m = SD.$("#fGps"); if (m) m.textContent = gps ? `📍 ${t("gps_ok")}` : t("gps_fail"); });
    SD.bindPhoto("#fPhoto", "#fPrev", (p) => { photo = p; });
    SD.$("#ff").onsubmit = (e) => {
      e.preventDefault(); const f = new FormData(e.target);
      const total = SD.num(f.get("toilets_total"));
      const fn = SD.num(f.get("toilets_functional"));
      let nf = f.get("toilets_non_functional");
      nf = nf === "" || nf == null ? Math.max(0, total - fn) : SD.num(nf);
      const out = {
        id: rec ? rec.id : SD.uuid(), name: f.get("name"), ward_id: f.get("ward_id"),
        village_id: f.get("village_id") || null,
        toilets_total: total, toilets_functional: fn, toilets_non_functional: nf,
        notes: f.get("notes") || null, lat: gps && gps.lat, lng: gps && gps.lng, photo, updated_at: SD.nowISO(),
      };
      if (f.get("kind")) out.kind = f.get("kind");
      if (f.get("bkind")) out.kind = f.get("bkind");
      SD.put(table, out); SD.closeSheet(); SD.toast(t("saved")); SD.render();
    };
  });
};
SD.listScreen = function (title, rows, onAdd, onClick, mapPoints) {
  const pts = (mapPoints || []).filter((p) => p && p.lat && p.lng);
  SD.shell(`${SD.statusHTML()}<div class="card"><h3>${SD.esc(title)}<span class="r">${rows.length}</span></h3>
    ${onAdd ? `<button class="btn" id="addEnt">＋ ${SD.esc(t("add"))}</button><div style="height:12px"></div>` : ""}
    ${pts.length ? `<div id="lsmap" class="mapbox"></div>` : ""}
    <div class="list">${rows.map((r, i) => `<div data-i="${i}" role="button">${r.html}</div>`).join("") || `<div class="empty">${SD.esc(t("no_data"))}</div>`}</div></div>`);
  if (onAdd) SD.$("#addEnt").onclick = onAdd;
  SD.appEl().querySelectorAll("[data-i]").forEach((el) => (el.onclick = () => onClick && onClick(rows[+el.dataset.i].rec)));
  if (pts.length && SD.$("#lsmap")) SD.showMap(SD.$("#lsmap"), pts);
};
