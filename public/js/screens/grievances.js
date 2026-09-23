const GCATS = ["missed_collection", "irregular_timing", "no_segregation_bin", "drain_blockage", "garbage_dump", "toilet_issue", "vehicle_issue", "other"];
SD.grievanceSheet = function (h) {
  SD.sheet(t("new_grievance"), `<form id="gform">
    <label>${SD.esc(t("g_category"))}</label>
    <select name="category">${GCATS.map((c) => `<option value="${c}">${SD.esc(t("g_" + c))}</option>`).join("")}</select>
    <label>${SD.esc(t("ward"))}</label>${SD.wardSelect("ward_id", (h && h.ward_id) || SD.myWardId())}
    <label>${SD.esc(t("description"))}</label><textarea name="description" rows="3"></textarea>
    <label>${SD.esc(t("photo"))}</label><input type="file" accept="image/*" capture="environment" id="gPhoto"><div id="gPrev"></div>
    <div style="height:14px"></div><div class="row"><button type="button" class="btn gray" onclick="closeSheet()">${SD.esc(t("cancel"))}</button>
    <button class="btn" type="submit">✔ ${SD.esc(t("save"))}</button></div></form>`, () => {
    let photo = null;
    SD.bindPhoto("#gPhoto", "#gPrev", (p) => { photo = p; });
    SD.$("#gform").onsubmit = async (e) => {
      e.preventDefault();
      const f = new FormData(e.target); const g = await SD.getGPS(); const w = SD.wardById(f.get("ward_id"));
      SD.put("grievances", {
        id: SD.uuid(), household_id: h ? h.id : null, ward_id: f.get("ward_id"), block_id: w && w.block_id,
        category: f.get("category"), description: f.get("description") || null, status: "open", priority: "normal",
        raised_by: SD.S.user.id, raised_by_name: h ? h.head_name : SD.S.user.name, ts: SD.nowISO(),
        lat: g && g.lat, lng: g && g.lng, photo, assigned_to: null, resolution: null, resolved_ts: null,
      });
      SD.closeSheet(); SD.toast("✔ " + t("saved")); SD.render();
    };
  });
};
SD.screens.grievances = function () {
  const wards = SD.visibleWards();
  let list = SD.S.data.grievances.filter((g) => wards.some((w) => w.id === g.ward_id) || !g.ward_id);
  SD.listScreen(t("grievance"), list.map((g) => ({ rec: g, html: SD.item(t("g_" + g.category), SD.wardName(g.ward_id) + " · " + SD.dmy(g.ts), `<span class="tag ${g.status === "resolved" ? "" : "red"}">${SD.esc(t(g.status))}</span>`) })),
    () => SD.grievanceSheet(),
    (g) => {
      SD.sheet(t("g_" + g.category), `${g.description ? `<p>${SD.esc(g.description)}</p>` : ""}
        ${g.photo ? `<img src="${g.photo}" style="width:100%;border-radius:12px">` : ""}
        ${g.status !== "resolved" ? `<textarea id="resTxt" rows="3"></textarea><div class="row"><button class="btn gray" id="gProg">${SD.esc(t("in_progress"))}</button>
        <button class="btn" id="gRes">${SD.esc(t("mark_resolved"))}</button></div>` : ""}`, () => {
        const upd = (status) => { SD.put("grievances", Object.assign({}, g, { status, resolution: (SD.$("#resTxt") && SD.$("#resTxt").value) || g.resolution, resolved_ts: status === "resolved" ? SD.nowISO() : g.resolved_ts })); SD.closeSheet(); SD.render(); };
        if (SD.$("#gProg")) SD.$("#gProg").onclick = () => upd("in_progress");
        if (SD.$("#gRes")) SD.$("#gRes").onclick = () => upd("resolved");
      });
    });
};
