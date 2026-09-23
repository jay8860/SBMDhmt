SD.hhItem = function (h) {
  const due = SD.duesOf(h);
  return `<div class="item" data-hh="${h.id}"><div class="av">${SD.esc((h.house_no || h.head_name || "?").toString().slice(0, 3))}</div>
    <div class="bd"><div class="t">${SD.esc(h.head_name)}</div><div class="s">${SD.esc(h.code)} · ${SD.esc(t("cat_" + (h.category || "household")))}</div></div>
    ${due > 0 ? `<span class="tag amber">${SD.esc(t("dues"))} ${SD.inr(due)}</span>` : ""}<span style="color:var(--ink3)">›</span></div>`;
};
SD.pickHousehold = function (cb) {
  const wards = SD.visibleWards();
  let list = SD.S.data.households.filter((h) => Number(h.active) !== 0 && wards.some((w) => w.id === h.ward_id));
  SD.sheet(t("pick_from_list"), `<input id="pq" placeholder="${SD.esc(t("search"))}"><div class="list" id="plist"></div>`, () => {
    const draw = (q) => {
      const f = q ? list.filter((h) => (h.head_name || "").toLowerCase().includes(q) || (h.code || "").toLowerCase().includes(q)) : list;
      SD.$("#plist").innerHTML = f.slice(0, 80).map(SD.hhItem).join("") || `<div class="empty">${SD.esc(t("no_data"))}</div>`;
      SD.$("#plist").querySelectorAll("[data-hh]").forEach((el) => (el.onclick = () => { SD.closeSheet(); cb(SD.hhById(el.dataset.hh)); }));
    };
    draw(""); SD.$("#pq").oninput = (e) => draw(e.target.value.toLowerCase());
  });
};
SD.householdForm = function (h) {
  const FEE = { household: 30, shop: 100, hotel: 300, institution: 200, clinic: 250 };
  SD.sheet(h ? t("edit_household") : t("add_household"), `<form id="hf">
    <label>${SD.esc(t("head_name"))} *</label><input name="head_name" required value="${SD.esc(h ? h.head_name : "")}">
    <div class="row"><div><label>${SD.esc(t("house_no"))}</label><input name="house_no" value="${SD.esc(h ? h.house_no || "" : "")}"></div>
    <div><label>${SD.esc(t("phone"))}</label><input name="phone" value="${SD.esc(h ? h.phone || "" : "")}"></div></div>
    <label>${SD.esc(t("ward"))}</label>${SD.wardSelect("ward_id", (h && h.ward_id) || SD.myWardId())}
    <label>${SD.esc(t("category"))}</label>
    <select name="category" id="catSel">${["household", "shop", "hotel", "institution", "clinic"].map((c) => `<option value="${c}" ${h && h.category === c ? "selected" : ""}>${SD.esc(t("cat_" + c))}</option>`).join("")}</select>
    <div class="row"><div><label>${SD.esc(t("fee_slab"))}</label><input name="fee_slab" id="feeInp" type="number" value="${h ? SD.num(h.fee_slab) : 30}"></div>
    <div><label>${SD.esc(t("family_size"))}</label><input name="family_size" type="number" value="${h ? h.family_size || "" : ""}"></div></div>
    <div class="chips">
      <button type="button" class="chip ${!h || Number(h.toilet) ? "on" : ""}" data-f="toilet">${SD.esc(t("toilet"))}</button>
      <button type="button" class="chip ${h && Number(h.soak_pit) ? "on" : ""}" data-f="soak_pit">${SD.esc(t("soak_pit"))}</button>
      <button type="button" class="chip ${h && Number(h.compost_pit) ? "on" : ""}" data-f="compost_pit">${SD.esc(t("compost_pit"))}</button>
    </div>
    <div class="hint" id="hfGps">${SD.esc(t("gps_capturing"))}</div>
    <div style="height:14px"></div><div class="row"><button type="button" class="btn gray" onclick="closeSheet()">${SD.esc(t("cancel"))}</button>
    <button class="btn" type="submit">✔ ${SD.esc(t("save"))}</button></div></form>`, (root) => {
    const flags = { toilet: !h || !!Number(h.toilet), soak_pit: !!(h && Number(h.soak_pit)), compost_pit: !!(h && Number(h.compost_pit)) };
    let gps = h && h.lat ? { lat: h.lat, lng: h.lng } : null;
    SD.getGPS().then((g) => { if (g) gps = g; const m = SD.$("#hfGps"); if (m) m.textContent = gps ? `📍 ${t("gps_ok")}` : t("gps_fail"); });
    root.querySelectorAll("[data-f]").forEach((b) => (b.onclick = () => { flags[b.dataset.f] = !flags[b.dataset.f]; b.classList.toggle("on", flags[b.dataset.f]); }));
    SD.$("#catSel").onchange = (e) => { SD.$("#feeInp").value = FEE[e.target.value] || 0; };
    SD.$("#hf").onsubmit = (e) => {
      e.preventDefault();
      const f = new FormData(e.target); const ward = SD.wardById(f.get("ward_id"));
      const prefix = `DHM-${((ward && ward.code) || "X").toUpperCase()}`;
      let max = 0; SD.S.data.households.filter((x) => x.ward_id === f.get("ward_id")).forEach((x) => { const m = /(\d+)$/.exec(x.code || ""); if (m) max = Math.max(max, +m[1]); });
      SD.put("households", {
        id: h ? h.id : SD.uuid(), code: h ? h.code : `${prefix}-${String(max + 1).padStart(4, "0")}`,
        head_name: f.get("head_name"), phone: f.get("phone") || null, ward_id: f.get("ward_id"),
        house_no: f.get("house_no") || null, category: f.get("category"), fee_slab: SD.num(f.get("fee_slab")),
        family_size: f.get("family_size") ? SD.num(f.get("family_size")) : null,
        lat: gps && gps.lat, lng: gps && gps.lng,
        toilet: flags.toilet ? 1 : 0, soak_pit: flags.soak_pit ? 1 : 0, compost_pit: flags.compost_pit ? 1 : 0,
        active: 1, created_by: SD.S.user.id, created_at: h ? h.created_at : SD.nowISO(), updated_at: SD.nowISO(),
      });
      SD.closeSheet(); SD.toast("✔ " + t("saved")); SD.render();
    };
  });
};
SD.screens.houses = function () {
  const wards = SD.visibleWards();
  const q = (SD.S.filters.q || "").toLowerCase();
  const wsel = SD.S.filters.ward_id || (SD.isField(SD.S.user) ? SD.myWardId() : "");
  let list = SD.S.data.households.filter((h) => Number(h.active) !== 0);
  if (wsel) list = list.filter((h) => h.ward_id === wsel);
  else list = list.filter((h) => wards.some((w) => w.id === h.ward_id));
  if (q) list = list.filter((h) => (h.head_name || "").toLowerCase().includes(q) || (h.code || "").toLowerCase().includes(q));
  SD.shell(`${SD.statusHTML()}<div class="card"><input id="hqs" placeholder="${SD.esc(t("search"))}" value="${SD.esc(SD.S.filters.q || "")}">
    ${!SD.isField(SD.S.user) ? `<label>${SD.esc(t("ward"))}</label><select id="hws"><option value="">${SD.esc(t("all_wards"))}</option>${wards.map((w) => `<option value="${w.id}" ${wsel === w.id ? "selected" : ""}>${SD.esc(w.name_hi)}</option>`).join("")}</select>` : ""}
    <div style="height:12px"></div><button class="btn sec" id="addHH">＋ ${SD.esc(t("add_household"))}</button></div>
    <div class="card"><h3>${SD.esc(t("households"))}<span class="r">${list.length}</span></h3>
    <div class="list">${list.slice(0, 300).map(SD.hhItem).join("") || `<div class="empty">${SD.esc(t("no_data"))}</div>`}</div></div>`);
  SD.$("#hqs").oninput = (e) => { SD.S.filters.q = e.target.value; SD.screens.houses(); };
  if (SD.$("#hws")) SD.$("#hws").onchange = (e) => { SD.S.filters.ward_id = e.target.value; SD.screens.houses(); };
  SD.$("#addHH").onclick = () => SD.householdForm(null);
  SD.appEl().querySelectorAll("[data-hh]").forEach((el) => (el.onclick = () => {
    const h = SD.hhById(el.dataset.hh);
    SD.sheet(h.head_name, `<div class="row"><button class="btn" id="hsCol">${SD.esc(t("collection"))}</button>
      <button class="btn sec" id="hsFee">${SD.esc(t("fee"))}</button></div>
      <div style="height:8px"></div><div class="row"><button class="btn gray sm" id="hsEdit">${SD.esc(t("edit_household"))}</button>
      <button class="btn gray sm" id="hsIHHL">${SD.esc(t("ihhl"))}</button></div>`, () => {
      SD.$("#hsCol").onclick = () => SD.collectionSheet(h);
      SD.$("#hsFee").onclick = () => SD.feeSheet(h);
      SD.$("#hsEdit").onclick = () => SD.householdForm(h);
      SD.$("#hsIHHL").onclick = () => SD.ihhlForm(null, h);
    });
  }));
};
