const ATYPES = ["compost_pit", "soak_pit", "community_toilet", "dustbin", "vehicle", "SLRM", "MCF", "RRF", "other"];
const TYPED = ["compost_pit", "soak_pit", "community_toilet", "dustbin", "vehicle", "SLRM", "MCF"];
SD.assetForm = function (filterType, rec) {
  let cond = (rec && rec.condition) || "functional", photo = rec && rec.photo, gps = rec && rec.lat ? { lat: rec.lat, lng: rec.lng } : null;
  const types = ATYPES.filter((a) => !filterType || a === filterType);
  SD.sheet(rec ? t("edit") : t("add_asset"), `<form id="af">
    <label>${SD.esc(t("asset_type"))}</label>
    <select name="asset_type" id="aType">${types.map((a) => `<option value="${a}" ${rec && rec.asset_type === a ? "selected" : ""}>${SD.esc(t("a_" + a))}</option>`).join("")}</select>
    <label>${SD.esc(t("name"))}</label><input name="name" required value="${SD.esc(rec ? rec.name : "")}">
    <label>${SD.esc(t("ward"))}</label>${SD.wardSelect("ward_id", (rec && rec.ward_id) || SD.myWardId())}
    <label>${SD.esc(t("condition"))}</label>
    <div class="chips">${["functional", "needs_repair", "non_functional"].map((c) => `<button type="button" class="chip ${cond === c ? "on" : ""}" data-c="${c}">${SD.esc(t(c))}</button>`).join("")}</div>
    <div data-x="capacity"><label>${SD.esc(t("capacity"))} / ${SD.esc(t("shed"))}</label><input name="capacity" value="${SD.esc(rec ? rec.capacity || "" : "")}"></div>
    <div data-x="toilet"><label>${SD.esc(t("toilets_total"))}</label><input name="toilet_count" type="number" value="${rec ? rec.toilet_count || "" : ""}"></div>
    <div data-x="reason"><label>${SD.esc(t("reason"))} / ${SD.esc(t("assignment"))}</label><input name="reason" value="${SD.esc(rec ? rec.reason || "" : "")}"></div>
    <div data-x="installed"><label>${SD.esc(t("installed_on"))}</label><input name="installed_on" type="date" value="${SD.esc(rec ? rec.installed_on || "" : "")}"></div>
    <label>${SD.esc(t("photo"))}</label><input type="file" accept="image/*" capture="environment" id="aPhoto"><div id="aPrev">${photo ? `<img src="${photo}" style="width:100%;border-radius:10px;margin-top:8px">` : ""}</div>
    <div class="hint" id="aGps">${SD.esc(t("gps_capturing"))}</div>
    <button class="btn" type="submit">${SD.esc(t("save"))}</button></form>`, (root) => {
    const extras = () => {
      const type = SD.$("#aType").value;
      const show = (key, on) => { const el = root.querySelector("[data-x=" + key + "]"); if (el) el.classList.toggle("hidden", !on); };
      show("toilet", type === "community_toilet");
      show("reason", type === "vehicle");
      show("installed", type === "dustbin" || type === "community_toilet");
      show("capacity", type === "SLRM" || type === "MCF" || type === "vehicle" || type === "compost_pit" || type === "RRF");
    };
    extras();
    SD.$("#aType").onchange = extras;
    SD.getGPS().then((g) => { if (g) gps = g; const m = SD.$("#aGps"); if (m) m.textContent = gps ? `📍 ${t("gps_ok")}` : t("gps_fail"); });
    root.querySelectorAll("[data-c]").forEach((b) => (b.onclick = () => { cond = b.dataset.c; root.querySelectorAll("[data-c]").forEach((x) => x.classList.toggle("on", x === b)); }));
    SD.bindPhoto("#aPhoto", "#aPrev", (p) => { photo = p; });
    SD.$("#af").onsubmit = (e) => {
      e.preventDefault(); const f = new FormData(e.target); const w = SD.wardById(f.get("ward_id"));
      SD.put("assets", {
        id: rec ? rec.id : SD.uuid(), asset_type: f.get("asset_type"), name: f.get("name"), ward_id: f.get("ward_id"),
        block_id: w && w.block_id, condition: cond, capacity: f.get("capacity") || null,
        toilet_count: f.get("toilet_count") ? SD.num(f.get("toilet_count")) : null,
        reason: f.get("reason") || null, installed_on: f.get("installed_on") || null,
        ownership: "panchayat", lat: gps && gps.lat, lng: gps && gps.lng, photo, notes: null,
        surveyed_by: SD.S.user.id, ts: rec ? rec.ts : SD.nowISO(),
      });
      SD.closeSheet(); SD.toast(t("saved")); SD.render();
    };
  });
};
SD.screens.assets = function () {
  const type = SD.S.filters.asset_type || "";
  let list = (SD.S.data.assets || []).filter((a) => SD.visibleWards().some((w) => w.id === a.ward_id));
  if (type) list = list.filter((a) => a.asset_type === type);
  const fn = list.filter((a) => a.condition === "functional").length;
  const nf = list.filter((a) => a.condition === "non_functional").length;
  SD.shell(`${SD.statusHTML()}<div class="kpis k3">
    <div class="kpi green"><div class="v">${fn}</div><div class="l">${SD.esc(t("functional"))}</div></div>
    <div class="kpi red"><div class="v">${nf}</div><div class="l">${SD.esc(t("non_functional"))}</div></div>
    <div class="kpi blue"><div class="v">${list.length}</div><div class="l">${SD.esc(t("assets"))}</div></div></div>
    <div class="card">
    <div class="chips" id="aChips">${["", ...TYPED].map((a) => `<button type="button" class="chip ${type === a ? "on" : ""}" data-at="${a}">${SD.esc(a ? t("a_" + a) : t("all_wards"))}</button>`).join("")}</div>
    <div style="height:10px"></div>
    <select id="at"><option value="">${SD.esc(t("all_wards"))}</option>${ATYPES.map((a) => `<option value="${a}" ${type === a ? "selected" : ""}>${SD.esc(t("a_" + a))}</option>`).join("")}</select>
    <div style="height:10px"></div><button class="btn" id="addA">＋ ${SD.esc(t("add_asset"))}</button>
    <div class="list" style="margin-top:12px">${list.map((a) => SD.item(a.name, `${t("a_" + a.asset_type)} · ${SD.wardName(a.ward_id)}${a.installed_on ? " · " + a.installed_on : ""}${a.reason ? " · " + a.reason : ""}`, `<span class="tag">${SD.esc(t(a.condition))}</span>`, `data-id="${a.id}" role="button"`)).join("") || `<div class="empty">${SD.esc(t("no_data"))}</div>`}</div>
    ${list.some((a) => a.lat) ? `<div id="amap" class="mapbox"></div>` : ""}</div>`);
  const setType = (v) => { SD.S.filters.asset_type = v; SD.screens.assets(); };
  SD.$("#at").onchange = (e) => setType(e.target.value);
  SD.appEl().querySelectorAll("[data-at]").forEach((b) => (b.onclick = () => setType(b.dataset.at)));
  SD.$("#addA").onclick = () => SD.assetForm(type || null);
  SD.appEl().querySelectorAll("[data-id]").forEach((el) => (el.onclick = () => SD.assetForm(null, SD.S.data.assets.find((x) => x.id === el.dataset.id))));
  const mapEl = SD.$("#amap");
  if (mapEl) SD.showMap(mapEl, list.filter((a) => a.lat).map((a) => ({ lat: a.lat, lng: a.lng, label: a.name })));
};
