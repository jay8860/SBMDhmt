const IHHL = ["approved", "under_construction", "completed", "geotagged", "incentive_paid"];
SD.ihhlForm = function (rec, household) {
  const h = household || SD.hhById(rec && rec.household_id);
  let photo = rec && rec.photo, gps = rec && rec.lat ? { lat: rec.lat, lng: rec.lng } : null;
  const from = rec ? Math.max(0, IHHL.indexOf(rec.status)) : 0;
  const opts = IHHL.filter((_, i) => i >= from);
  SD.sheet(t("ihhl"), `<form id="if">
    <p class="hint">${SD.esc(h ? h.head_name : "")}</p>
    <label>${SD.esc(t("status"))}</label>
    <select name="status">${opts.map((s) => `<option value="${s}" ${rec && rec.status === s ? "selected" : ""}>${SD.esc(t(s))}</option>`).join("")}</select>
    <label>${SD.esc(t("incentive"))}</label><input name="incentive_amount" type="number" value="${rec ? rec.incentive_amount || "" : ""}">
    <label>${SD.esc(t("incentive_status"))}</label><input name="incentive_status" value="${SD.esc(rec ? rec.incentive_status || "" : "")}">
    <label>${SD.esc(t("incentive_date"))}</label><input name="incentive_date" type="date" value="${SD.esc(rec ? rec.incentive_date || "" : "")}">
    <label>${SD.esc(t("photo"))}</label><input type="file" accept="image/*" capture="environment" id="iPhoto"><div id="iPrev">${rec && rec.photo ? `<img src="${rec.photo}" style="width:100%;border-radius:10px">` : ""}</div>
    <div class="hint" id="iGps">${SD.esc(t("gps_capturing"))}</div>
    <button class="btn" type="submit">${SD.esc(t("save"))}</button></form>`, () => {
    SD.getGPS().then((g) => { if (g) gps = g; const m = SD.$("#iGps"); if (m) m.textContent = gps ? `📍 ${t("gps_ok")}` : t("gps_fail"); });
    SD.bindPhoto("#iPhoto", "#iPrev", (p) => { photo = p; });
    SD.$("#if").onsubmit = (e) => {
      e.preventDefault(); const f = new FormData(e.target);
      let status = f.get("status");
      if (status === "completed" && gps && photo) status = "geotagged";
      SD.put("ihhl", {
        id: rec ? rec.id : SD.uuid(), household_id: h.id, ward_id: h.ward_id, status,
        lat: gps && gps.lat, lng: gps && gps.lng, photo,
        incentive_amount: f.get("incentive_amount") ? SD.num(f.get("incentive_amount")) : null,
        incentive_status: f.get("incentive_status") || null, incentive_date: f.get("incentive_date") || null,
        updated_by: SD.S.user.id, updated_at: SD.nowISO(),
      });
      SD.closeSheet(); SD.toast(t("saved")); SD.render();
    };
  });
};
SD.screens.ihhl = function () {
  const rows = (SD.S.data.ihhl || []).filter((r) => SD.visibleWards().some((w) => w.id === r.ward_id));
  SD.shell(`${SD.statusHTML()}<div class="card"><button class="btn" id="addI">＋ ${SD.esc(t("ihhl"))}</button>
    <div id="imap" class="mapbox"></div>
    <div class="list">${rows.map((r) => {
      const h = SD.hhById(r.household_id);
      return SD.item(h ? h.head_name : r.household_id, t(r.status), `<span class="tag">${SD.esc(t(r.status))}</span>`, `data-id="${r.id}" role="button"`);
    }).join("") || `<div class="empty">${SD.esc(t("no_data"))}</div>`}</div></div>`);
  SD.$("#addI").onclick = () => SD.pickHousehold((h) => SD.ihhlForm(null, h));
  SD.appEl().querySelectorAll("[data-id]").forEach((el) => (el.onclick = () => SD.ihhlForm(rows.find((x) => x.id === el.dataset.id))));
  SD.showMap(SD.$("#imap"), rows.filter((r) => r.lat).map((r) => {
    const h = SD.hhById(r.household_id);
    return { lat: r.lat, lng: r.lng, label: h ? h.head_name : r.status };
  }));
};
