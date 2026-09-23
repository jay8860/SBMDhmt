SD.screens.greywater = function () {
  const rows = (SD.S.data.greywater_cases || []).filter((r) => SD.visibleWards().some((w) => w.id === r.ward_id));
  SD.shell(`${SD.statusHTML()}<div class="card"><button class="btn" id="addG">＋ ${SD.esc(t("greywater"))}</button>
    <div id="gmap" class="mapbox"></div>
    <div class="list">${rows.map((r) => SD.item(r.location_name || t("location"), r.action_status || "open", r.janpad_submitted_on ? `<span class="tag">${SD.esc(t("janpad_date"))}</span>` : "", `data-id="${r.id}" role="button"`)).join("") || `<div class="empty">${SD.esc(t("no_data"))}</div>`}</div></div>`);
  SD.$("#addG").onclick = () => SD.greyForm(null);
  SD.appEl().querySelectorAll("[data-id]").forEach((el) => (el.onclick = () => SD.greyForm(rows.find((x) => x.id === el.dataset.id))));
  SD.showMap(SD.$("#gmap"), rows.filter((r) => r.lat).map((r) => ({ lat: r.lat, lng: r.lng, label: r.location_name })));
};
SD.greyForm = function (rec) {
  let photo = rec && rec.photo, gps = rec && rec.lat ? { lat: rec.lat, lng: rec.lng } : null;
  const soaks = (SD.S.data.assets || []).filter((a) => a.asset_type === "soak_pit");
  SD.sheet(t("greywater"), `<form id="gf">
    <label>${SD.esc(t("accumulates"))}</label>
    <select name="accumulates"><option value="1">${SD.esc(t("yes"))}</option><option value="0" ${rec && !Number(rec.accumulates) ? "selected" : ""}>${SD.esc(t("no"))}</option></select>
    <label>${SD.esc(t("location"))}</label><input name="location_name" value="${SD.esc(rec ? rec.location_name || "" : "")}">
    <label>${SD.esc(t("ward"))}</label>${SD.wardSelect("ward_id", (rec && rec.ward_id) || SD.myWardId())}
    <label>${SD.esc(t("description"))}</label><textarea name="problem">${SD.esc(rec ? rec.problem || "" : "")}</textarea>
    <label>${SD.esc(t("proposed_action"))}</label><textarea name="proposed_action">${SD.esc(rec ? rec.proposed_action || "" : "")}</textarea>
    <label>${SD.esc(t("status"))}</label><input name="action_status" value="${SD.esc(rec ? rec.action_status || "open" : "open")}">
    <label>${SD.esc(t("janpad_date"))}</label><input name="janpad_submitted_on" type="date" value="${SD.esc(rec ? rec.janpad_submitted_on || "" : "")}">
    <label>${SD.esc(t("a_soak_pit"))}</label>
    <select name="soak_pit_asset_id"><option value="">—</option>${soaks.map((a) => `<option value="${a.id}" ${rec && rec.soak_pit_asset_id === a.id ? "selected" : ""}>${SD.esc(a.name)}</option>`).join("")}</select>
    <label>${SD.esc(t("photo"))}</label><input type="file" accept="image/*" id="gwPhoto"><div id="gwPrev">${rec && rec.photo ? `<img src="${rec.photo}" style="width:100%;border-radius:10px">` : ""}</div>
    <div class="hint" id="gwGps">${SD.esc(t("gps_capturing"))}</div>
    <button class="btn" type="submit">${SD.esc(t("save"))}</button></form>`, () => {
    SD.getGPS().then((g) => { if (g) gps = g; const m = SD.$("#gwGps"); if (m) m.textContent = gps ? `📍 ${t("gps_ok")}` : t("gps_fail"); });
    SD.bindPhoto("#gwPhoto", "#gwPrev", (p) => { photo = p; });
    SD.$("#gf").onsubmit = (e) => {
      e.preventDefault(); const f = new FormData(e.target);
      SD.put("greywater_cases", {
        id: rec ? rec.id : SD.uuid(), ward_id: f.get("ward_id"), accumulates: f.get("accumulates") === "1" ? 1 : 0,
        location_name: f.get("location_name"), problem: f.get("problem"), proposed_action: f.get("proposed_action"),
        action_status: f.get("action_status"), janpad_submitted_on: f.get("janpad_submitted_on") || null,
        soak_pit_asset_id: f.get("soak_pit_asset_id") || null, lat: gps && gps.lat, lng: gps && gps.lng, photo,
        raised_by: SD.S.user.id, ts: rec ? rec.ts : SD.nowISO(), updated_at: SD.nowISO(),
      });
      SD.closeSheet(); SD.toast(t("saved")); SD.render();
    };
  });
};
