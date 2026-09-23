SD.screens.gp = function () {
  const gps = SD.visibleWards().filter((w) => w.kind === "gp");
  const canAdd = ["admin", "state_admin"].includes(SD.S.user.role);
  SD.shell(`${SD.statusHTML()}<div class="card"><h3>${SD.esc(t("gp_profile"))}<span class="r">${gps.length}</span></h3>
    ${canAdd ? `<div class="row"><button class="btn sm" id="addGp">＋ ${SD.esc(t("add_gp"))}</button>
      <button class="btn sm sec" id="addBlk">＋ ${SD.esc(t("add_block"))}</button></div><div style="height:12px"></div>` : ""}
    <div class="list">${gps.map((w, i) => `<div data-i="${i}" role="button">${SD.item(w.name_hi, ((SD.S.data.gp_profiles || []).find((x) => x.ward_id === w.id) || {}).sarpanch_name || t("sarpanch") + " —")}</div>`).join("") || `<div class="empty">${SD.esc(t("no_data"))}</div>`}</div></div>`);
  if (SD.$("#addGp")) SD.$("#addGp").onclick = () => SD.wardForm();
  if (SD.$("#addBlk")) SD.$("#addBlk").onclick = () => SD.blockForm();
  SD.appEl().querySelectorAll("[data-i]").forEach((el) => (el.onclick = () => SD.gpForm(gps[+el.dataset.i])));
};
SD.blockForm = function () {
  const districts = SD.S.data.districts || [];
  SD.sheet(t("add_block"), `<form id="bf"><label>${SD.esc(t("name"))}</label><input name="name_hi" required>
    <label>${SD.esc(t("district"))}</label><select name="district_id">${districts.map((d) => `<option value="${d.id}" ${SD.S.user.district_id === d.id ? "selected" : ""}>${SD.esc(d.name_hi)}</option>`).join("")}</select>
    <label>Code</label><input name="code"><button class="btn" type="submit">${SD.esc(t("save"))}</button></form>`, () => {
    SD.$("#bf").onsubmit = async (e) => {
      e.preventDefault(); const f = new FormData(e.target);
      try {
        await SD.api("/api/blocks", { method: "POST", body: JSON.stringify({ name_hi: f.get("name_hi"), name_en: f.get("name_hi"), district_id: f.get("district_id"), code: f.get("code") }) });
        await SD.bootstrap(); SD.closeSheet(); SD.render();
      } catch (err) { SD.toast(err.message); }
    };
  });
};
SD.wardForm = function () {
  SD.sheet(t("add"), `<form id="wf"><label>${SD.esc(t("name"))}</label><input name="name_hi" required>
    <label>${SD.esc(t("block"))}</label><select name="block_id">${SD.visibleBlocks().map((b) => `<option value="${b.id}">${SD.esc(b.name_hi)}</option>`).join("")}</select>
    <label>Code</label><input name="code"><button class="btn" type="submit">${SD.esc(t("save"))}</button></form>`, () => {
    SD.$("#wf").onsubmit = async (e) => {
      e.preventDefault(); const f = new FormData(e.target);
      try {
        await SD.api("/api/wards", { method: "POST", body: JSON.stringify({ name_hi: f.get("name_hi"), name_en: f.get("name_hi"), block_id: f.get("block_id"), kind: "gp", code: f.get("code") }) });
        await SD.bootstrap(); SD.closeSheet(); SD.render();
      } catch (err) { SD.toast(err.message); }
    };
  });
};
SD.gpForm = function (w) {
  const p = (SD.S.data.gp_profiles || []).find((x) => x.ward_id === w.id) || {};
  const b = SD.blockById(w.block_id);
  const d = (SD.S.data.districts || []).find((x) => x.id === (b && b.district_id));
  const st = (SD.S.data.states || []).find((x) => x.id === (d && d.state_id));
  SD.sheet(w.name_hi, `<form id="gpf">
    <p class="hint">${SD.esc(t("block"))}: ${SD.esc(b && b.name_hi)} · ${SD.esc(t("district"))}: ${SD.esc(d && d.name_hi)} · ${SD.esc(t("state"))}: ${SD.esc(st && st.name_hi)} · ${SD.esc(w.code || "")}</p>
    <label>${SD.esc(t("sarpanch"))}</label><input name="sarpanch_name" value="${SD.esc(p.sarpanch_name || "")}">
    <label>${SD.esc(t("phone"))}</label><input name="sarpanch_mobile" value="${SD.esc(p.sarpanch_mobile || "")}">
    <label>${SD.esc(t("secretary"))}</label><input name="secretary_name" value="${SD.esc(p.secretary_name || "")}">
    <label>${SD.esc(t("phone"))}</label><input name="secretary_mobile" value="${SD.esc(p.secretary_mobile || "")}">
    <div style="height:12px"></div><button class="btn" type="submit">${SD.esc(t("save"))}</button></form>`, () => {
    SD.$("#gpf").onsubmit = (e) => {
      e.preventDefault(); const f = new FormData(e.target);
      const rec = { id: p.id || ("gpp_" + w.id), ward_id: w.id, sarpanch_name: f.get("sarpanch_name"), sarpanch_mobile: f.get("sarpanch_mobile"), secretary_name: f.get("secretary_name"), secretary_mobile: f.get("secretary_mobile"), updated_at: SD.nowISO() };
      SD.put("gp_profiles", rec); SD.closeSheet(); SD.toast(t("saved")); SD.render();
    };
  });
};
