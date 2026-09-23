SD.collectionSheet = function (h) {
  const done = SD.S.data.collections.find((c) => c.household_id === h.id && c.service_date === SD.todayStr());
  SD.sheet(t("record_collection"), `
    <div class="item" style="cursor:default"><div class="av">${SD.esc((h.house_no || "?").toString().slice(0, 3))}</div>
      <div class="bd"><div class="t">${SD.esc(h.head_name)}</div><div class="s">${SD.esc(h.code)}</div></div>
      ${done ? `<span class="tag">${SD.esc(t("done_today"))}</span>` : ""}</div>
    <form id="colf">
      <label>${SD.esc(t("status"))}</label>
      <div class="chips">${["collected", "locked", "refused", "absent"].map((k, i) => `<button type="button" class="chip ${i === 0 ? "on" : ""}" data-st="${k}">${SD.esc(t(k))}</button>`).join("")}</div>
      <div id="qtyBox"><div class="row">
        <div><label>${SD.esc(t("wet"))} (${SD.esc(t("kg"))})</label><input name="wet_kg" type="number" step="0.1" min="0" value="1"></div>
        <div><label>${SD.esc(t("dry"))} (${SD.esc(t("kg"))})</label><input name="dry_kg" type="number" step="0.1" min="0" value="0.5"></div>
      </div>
      <label>${SD.esc(t("hazard"))}</label><input name="hazard_kg" type="number" step="0.1" min="0" value="0">
      <label>${SD.esc(t("segregated"))}</label>
      <div class="chips"><button type="button" class="chip on" data-seg="1">✅ ${SD.esc(t("yes"))}</button>
        <button type="button" class="chip" data-seg="0">❌ ${SD.esc(t("no"))}</button></div></div>
      <label>${SD.esc(t("notes"))}</label><textarea name="notes" rows="2"></textarea>
      <label>${SD.esc(t("photo"))}</label><input type="file" accept="image/*" capture="environment" id="colPhoto"><div id="colPhotoPrev"></div>
      <div class="hint" id="gpsMsg">${SD.esc(t("gps_capturing"))}</div>
      <div style="height:14px"></div><div class="row"><button type="button" class="btn gray" onclick="closeSheet()">${SD.esc(t("cancel"))}</button>
      <button class="btn" type="submit">✔ ${SD.esc(t("save"))}</button></div>
      <div style="height:10px"></div><button type="button" class="btn sec" id="alsoFee">💵 ${SD.esc(t("collect_fee"))}</button>
    </form>`, (root) => {
    let st = "collected", seg = 1, photo = null, gps = null;
    SD.getGPS().then((g) => { gps = g; const m = SD.$("#gpsMsg"); if (m) m.textContent = g ? `📍 ${t("gps_ok")}` : t("gps_fail"); });
    root.querySelectorAll("[data-st]").forEach((b) => (b.onclick = () => {
      st = b.dataset.st; root.querySelectorAll("[data-st]").forEach((x) => x.classList.toggle("on", x === b));
      SD.$("#qtyBox").style.display = st === "collected" ? "" : "none";
    }));
    root.querySelectorAll("[data-seg]").forEach((b) => (b.onclick = () => { seg = +b.dataset.seg; root.querySelectorAll("[data-seg]").forEach((x) => x.classList.toggle("on", x === b)); }));
    SD.bindPhoto("#colPhoto", "#colPhotoPrev", (p) => { photo = p; });
    SD.$("#alsoFee").onclick = () => SD.feeSheet(h);
    SD.$("#colf").onsubmit = (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      SD.put("collections", {
        id: SD.uuid(), household_id: h.id, ward_id: h.ward_id, user_id: SD.S.user.id,
        ts: SD.nowISO(), service_date: SD.todayStr(),
        wet_kg: st === "collected" ? SD.num(f.get("wet_kg")) : 0,
        dry_kg: st === "collected" ? SD.num(f.get("dry_kg")) : 0,
        hazard_kg: st === "collected" ? SD.num(f.get("hazard_kg")) : 0,
        segregated: st === "collected" ? seg : 0, status: st,
        lat: gps && gps.lat, lng: gps && gps.lng, photo, notes: f.get("notes") || null,
      });
      SD.closeSheet(); SD.toast("✔ " + t("saved")); SD.render();
    };
  });
};
