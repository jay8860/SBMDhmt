SD.screens.cleanliness = function () {
  const rows = (SD.S.data.cleanliness_cases || []).filter((r) => SD.visibleWards().some((w) => w.id === r.ward_id));
  SD.shell(`${SD.statusHTML()}<div class="card"><button class="btn" id="addC">＋ ${SD.esc(t("cleanliness"))}</button>
    <div id="cmap" class="mapbox"></div>
    <div class="list">${rows.map((r) => SD.item(r.location_name || t("location"), `${r.garbage_qty_kg || 0} kg · ${SD.dmy(r.ts)}`, r.after_photo ? `<span class="tag">${SD.esc(t("after_photo"))}</span>` : "", `data-id="${r.id}" role="button"`)).join("") || `<div class="empty">${SD.esc(t("no_data"))}</div>`}</div></div>`);
  SD.$("#addC").onclick = () => SD.cleanForm(null);
  SD.appEl().querySelectorAll("[data-id]").forEach((el) => (el.onclick = () => SD.cleanForm(rows.find((x) => x.id === el.dataset.id))));
  SD.showMap(SD.$("#cmap"), rows.filter((r) => r.lat).map((r) => ({ lat: r.lat, lng: r.lng, label: r.location_name })));
};
SD.cleanForm = function (rec) {
  let before = rec && rec.before_photo, after = rec && rec.after_photo, gps = rec && rec.lat ? { lat: rec.lat, lng: rec.lng } : null;
  SD.sheet(t("cleanliness"), `<form id="cf">
    <label>${SD.esc(t("location"))}</label><input name="location_name" value="${SD.esc(rec ? rec.location_name || "" : "")}">
    <label>${SD.esc(t("ward"))}</label>${SD.wardSelect("ward_id", (rec && rec.ward_id) || SD.myWardId())}
    <label>${SD.esc(t("hotspot"))}</label>
    <select name="hotspot_id"><option value="">—</option>${(SD.S.data.hotspots || []).map((h) => `<option value="${h.id}" ${rec && rec.hotspot_id === h.id ? "selected" : ""}>${SD.esc(h.name)}</option>`).join("")}</select>
    <label>${SD.esc(t("school"))}</label>
    <select name="school_id"><option value="">—</option>${(SD.S.data.schools || []).map((s) => `<option value="${s.id}" ${rec && rec.school_id === s.id ? "selected" : ""}>${SD.esc(s.name)}</option>`).join("")}</select>
    <label>${SD.esc(t("anganwadi"))}</label>
    <select name="anganwadi_id"><option value="">—</option>${(SD.S.data.anganwadis || []).map((s) => `<option value="${s.id}" ${rec && rec.anganwadi_id === s.id ? "selected" : ""}>${SD.esc(s.name)}</option>`).join("")}</select>
    <label>${SD.esc(t("garbage_qty"))} (kg)</label><input name="garbage_qty_kg" type="number" step="0.1" value="${rec ? rec.garbage_qty_kg || "" : ""}">
    <div class="ba"><div><label>${SD.esc(t("before_photo"))}</label><input type="file" accept="image/*" id="bPhoto"><div id="bPrev">${before ? `<img src="${before}">` : ""}</div></div>
      <div><label>${SD.esc(t("after_photo"))}</label><input type="file" accept="image/*" id="aPhoto2"><div id="aPrev2">${after ? `<img src="${after}">` : ""}</div></div></div>
    <div class="hint" id="cGps">${SD.esc(t("gps_capturing"))}</div>
    <button class="btn" type="submit">${SD.esc(t("save"))}</button></form>`, () => {
    SD.getGPS().then((g) => { if (g) gps = g; });
    SD.bindPhoto("#bPhoto", "#bPrev", (p) => { before = p; });
    SD.bindPhoto("#aPhoto2", "#aPrev2", (p) => { after = p; });
    SD.$("#cf").onsubmit = (e) => {
      e.preventDefault(); const f = new FormData(e.target);
      SD.put("cleanliness_cases", {
        id: rec ? rec.id : SD.uuid(), ward_id: f.get("ward_id"), hotspot_id: f.get("hotspot_id") || null,
        school_id: f.get("school_id") || null, anganwadi_id: f.get("anganwadi_id") || null,
        location_name: f.get("location_name"), lat: gps && gps.lat, lng: gps && gps.lng,
        garbage_qty_kg: SD.num(f.get("garbage_qty_kg")), before_photo: before, after_photo: after,
        uploaded_by: SD.S.user.id, status: after && before ? "cleaned" : "open", ts: rec ? rec.ts : SD.nowISO(), updated_at: SD.nowISO(),
      });
      SD.closeSheet(); SD.toast(t("saved")); SD.render();
    };
  });
};
SD.screens.monitoring = function () {
  const wards = SD.visibleWards();
  const rows = (SD.S.data.monitoring_visits || []).filter((r) => wards.some((w) => w.id === r.ward_id));
  const schools = SD.S.data.schools || [];
  const aws = SD.S.data.anganwadis || [];
  const targetName = (r) => {
    const list = r.target_type === "anganwadi" ? aws : schools;
    const hit = list.find((x) => x.id === r.target_id);
    return hit ? hit.name : t(r.target_type || "school");
  };
  SD.listScreen(
    t("monitoring"),
    rows.map((r) => ({ rec: r, html: SD.item(targetName(r), `${t(r.target_type || "school")} · ${r.activity || t("observation")} · ${t(r.status || "observed")} · ${SD.dmy(r.ts)}`) })),
    () => SD.monitorForm(null),
    (r) => SD.monitorForm(r),
    rows.map((r) => ({ lat: r.lat, lng: r.lng, label: targetName(r) }))
  );
};
SD.monitorForm = function (rec) {
  let photo = rec && rec.photo, gps = rec && rec.lat ? { lat: rec.lat, lng: rec.lng } : null;
  const wards = SD.visibleWards();
  const schools = (SD.S.data.schools || []).filter((s) => wards.some((w) => w.id === s.ward_id));
  const aws = (SD.S.data.anganwadis || []).filter((s) => wards.some((w) => w.id === s.ward_id));
  const st = rec ? rec.status || "observed" : "observed";
  SD.sheet(t("monitoring"), `<form id="mf">
    <label>${SD.esc(t("category"))}</label>
    <select name="target_type" id="tt">
      <option value="school" ${!rec || rec.target_type === "school" ? "selected" : ""}>${SD.esc(t("school"))}</option>
      <option value="anganwadi" ${rec && rec.target_type === "anganwadi" ? "selected" : ""}>${SD.esc(t("anganwadi"))}</option>
    </select>
    <label>${SD.esc(t("name"))}</label>
    <select name="target_id" id="tid" required></select>
    <label>${SD.esc(t("activity"))}</label><input name="activity" value="${SD.esc(rec ? rec.activity || "" : "")}">
    <label>${SD.esc(t("observation"))}</label><textarea name="observation">${SD.esc(rec ? rec.observation || "" : "")}</textarea>
    <label>${SD.esc(t("status"))}</label>
    <select name="status">
      <option value="observed" ${st === "observed" ? "selected" : ""}>${SD.esc(t("observed"))}</option>
      <option value="action_needed" ${st === "action_needed" ? "selected" : ""}>${SD.esc(t("action_needed"))}</option>
      <option value="resolved" ${st === "resolved" ? "selected" : ""}>${SD.esc(t("resolved"))}</option>
    </select>
    <label>${SD.esc(t("photo"))}</label><input type="file" accept="image/*" capture="environment" id="mPhoto"><div id="mPrev">${photo ? `<img src="${photo}" style="width:100%;border-radius:10px;margin-top:8px">` : ""}</div>
    <label>${SD.esc(t("ward"))}</label>${SD.wardSelect("ward_id", (rec && rec.ward_id) || SD.myWardId())}
    <div class="hint" id="mGps">${SD.esc(t("gps_capturing"))}</div>
    <button class="btn" type="submit">${SD.esc(t("save"))}</button></form>`, () => {
    const fill = () => {
      const type = SD.$("#tt").value;
      const list = type === "anganwadi" ? aws : schools;
      SD.$("#tid").innerHTML = list.map((s) => `<option value="${s.id}" ${rec && rec.target_id === s.id ? "selected" : ""}>${SD.esc(s.name)}</option>`).join("");
    };
    fill();
    SD.$("#tt").onchange = fill;
    SD.getGPS().then((g) => { if (g) gps = g; const m = SD.$("#mGps"); if (m) m.textContent = gps ? `📍 ${t("gps_ok")}` : t("gps_fail"); });
    SD.bindPhoto("#mPhoto", "#mPrev", (p) => { photo = p; });
    SD.$("#mf").onsubmit = (e) => {
      e.preventDefault(); const f = new FormData(e.target);
      if (!f.get("target_id")) { SD.toast(t("required")); return; }
      SD.put("monitoring_visits", {
        id: rec ? rec.id : SD.uuid(), ward_id: f.get("ward_id"), target_type: f.get("target_type"), target_id: f.get("target_id"),
        activity: f.get("activity"), observation: f.get("observation"), status: f.get("status") || "observed", photo,
        lat: gps && gps.lat, lng: gps && gps.lng, user_id: SD.S.user.id, ts: rec ? rec.ts : SD.nowISO(),
      });
      SD.closeSheet(); SD.toast(t("saved")); SD.render();
    };
  });
};
