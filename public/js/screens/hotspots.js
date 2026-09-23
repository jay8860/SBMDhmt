const FLOW = ["identified", "reported", "cleaning", "verified"];
SD.screens.hotspots = function () {
  const rows = (SD.S.data.hotspots || []).filter((r) => SD.visibleWards().some((w) => w.id === r.ward_id));
  SD.shell(`${SD.statusHTML()}<div class="card"><button class="btn" id="addH">＋ ${SD.esc(t("hotspot"))}</button>
    <div id="hmap" class="mapbox"></div>
    <div class="list">${rows.map((r) => SD.item(r.name, `${t(r.workflow)} · ${SD.wardName(r.ward_id)}`, `<span class="tag">${SD.esc(t(r.cleanliness_status || "dirty"))}</span>`, `data-id="${r.id}" role="button"`)).join("") || `<div class="empty">${SD.esc(t("no_data"))}</div>`}</div></div>`);
  SD.$("#addH").onclick = () => SD.hotspotForm(null);
  SD.appEl().querySelectorAll("[data-id]").forEach((el) => (el.onclick = () => SD.hotspotForm(rows.find((x) => x.id === el.dataset.id))));
  SD.showMap(SD.$("#hmap"), rows.filter((r) => r.lat).map((r) => ({ lat: r.lat, lng: r.lng, label: r.name })));
};
SD.hotspotForm = function (rec) {
  let photo = rec && rec.photo, gps = rec && rec.lat ? { lat: rec.lat, lng: rec.lng } : null;
  const from = rec ? Math.max(0, FLOW.indexOf(rec.workflow)) : 0;
  const opts = FLOW.filter((_, i) => i >= from);
  SD.sheet(t("hotspot"), `<form id="hf">
    <label>${SD.esc(t("name"))}</label><input name="name" required value="${SD.esc(rec ? rec.name : "")}">
    <label>${SD.esc(t("ward"))}</label>${SD.wardSelect("ward_id", (rec && rec.ward_id) || SD.myWardId())}
    <label>${SD.esc(t("status"))}</label>
    <select name="workflow">${opts.map((s) => `<option value="${s}" ${rec && rec.workflow === s ? "selected" : ""}>${SD.esc(t(s))}</option>`).join("")}</select>
    <label>${SD.esc(t("cleanliness"))}</label>
    <select name="cleanliness_status"><option value="dirty">${SD.esc(t("dirty"))}</option><option value="clean" ${rec && rec.cleanliness_status === "clean" ? "selected" : ""}>${SD.esc(t("clean"))}</option></select>
    <label>${SD.esc(t("notes"))}</label><textarea name="notes">${SD.esc(rec ? rec.notes || "" : "")}</textarea>
    <label>${SD.esc(t("photo"))}</label><input type="file" accept="image/*" capture="environment" id="hPhoto"><div id="hPrev">${rec && rec.photo ? `<img src="${rec.photo}" style="width:100%;border-radius:10px">` : ""}</div>
    <div class="hint" id="hGps">${SD.esc(t("gps_capturing"))}</div>
    <button class="btn" type="submit">${SD.esc(t("save"))}</button></form>`, () => {
    SD.getGPS().then((g) => { if (g) gps = g; const m = SD.$("#hGps"); if (m) m.textContent = gps ? `📍 ${t("gps_ok")}` : t("gps_fail"); });
    SD.bindPhoto("#hPhoto", "#hPrev", (p) => { photo = p; });
    SD.$("#hf").onsubmit = (e) => {
      e.preventDefault(); const f = new FormData(e.target);
      SD.put("hotspots", {
        id: rec ? rec.id : SD.uuid(), ward_id: f.get("ward_id"), name: f.get("name"),
        lat: gps && gps.lat, lng: gps && gps.lng, photo, cleanliness_status: f.get("cleanliness_status"),
        workflow: f.get("workflow"), notes: f.get("notes") || null, raised_by: SD.S.user.id,
        ts: rec ? rec.ts : SD.nowISO(), updated_at: SD.nowISO(),
      });
      SD.closeSheet(); SD.toast(t("saved")); SD.render();
    };
  });
};
