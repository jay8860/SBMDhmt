SD.screens.users = function () {
  SD.api("/api/users").then((users) => {
    SD.sheet(t("users"), `<button class="btn" id="addU">＋ ${SD.esc(t("add_user"))}</button><div style="height:12px"></div>
      <div class="list">${users.map((u) => `<div class="item" data-u="${u.id}"><div class="av">${SD.esc((u.name || "?").slice(0, 1))}</div>
        <div class="bd"><div class="t">${SD.esc(u.name)}</div><div class="s">${SD.esc(u.phone)} · ${SD.esc(SD.roleLabel(u.role))}</div></div></div>`).join("")}</div>
      <button class="btn gray" onclick="closeSheet()">${SD.esc(t("close"))}</button>`, () => {
      SD.$("#addU").onclick = () => SD.userForm(null);
      document.querySelectorAll("[data-u]").forEach((el) => (el.onclick = () => SD.userForm(users.find((x) => x.id === el.dataset.u))));
    });
  }).catch(() => SD.toast(t("offline")));
};
SD.userForm = function (u) {
  const roles = SD.S.user.role === "admin" || SD.S.user.role === "state_admin"
    ? ["swachhagrahi", "gp", "supervisor", "admin", "viewer", "state_admin"]
    : ["swachhagrahi"];
  const assigned = new Set((u && u.assignments || []).map((a) => a.village_id || a.ward_id));
  const villages = SD.S.data.villages || [];
  const villageBoxes = villages.filter((v) => SD.visibleWards().some((w) => w.id === v.ward_id)).map((v) =>
    `<label class="hint" style="display:block"><input type="checkbox" name="asg" value="${v.id}" data-ward="${v.ward_id}" ${assigned.has(v.id) || assigned.has(v.ward_id) ? "checked" : ""}> ${SD.esc(v.name_hi)}</label>`
  ).join("");
  const districts = SD.S.data.districts || [];
  SD.sheet(u ? u.name : t("add_user"), `<form id="uf">
    <label>${SD.esc(t("name"))}</label><input name="name" required value="${SD.esc(u ? u.name : "")}">
    <label>${SD.esc(t("phone"))}</label><input name="phone" required value="${SD.esc(u ? u.phone : "")}">
    <label>${SD.esc(t("aadhaar"))}</label><input name="aadhaar" value="${SD.esc(u ? u.aadhaar || "" : "")}">
    <label>${SD.esc(t("role"))}</label><select name="role">${roles.map((r) => `<option value="${r}" ${u && (u.role === r || (u.role === "didi" && r === "swachhagrahi")) ? "selected" : ""}>${SD.esc(SD.roleLabel(r))}</option>`).join("")}</select>
    ${SD.S.user.role === "state_admin" || SD.S.user.role === "admin" ? `<label>${SD.esc(t("district"))}</label><select name="district_id"><option value="">—</option>${districts.map((d) => `<option value="${d.id}" ${(u && u.district_id) === d.id || (!u && SD.S.user.district_id === d.id) ? "selected" : ""}>${SD.esc(d.name_hi)}</option>`).join("")}</select>` : ""}
    <label>${SD.esc(t("block"))}</label><select name="block_id"><option value="">—</option>${SD.visibleBlocks().map((b) => `<option value="${b.id}" ${u && u.block_id === b.id ? "selected" : ""}>${SD.esc(b.name_hi)}</option>`).join("")}</select>
    <label>${SD.esc(t("ward"))}</label><select name="ward_id"><option value="">—</option>${SD.visibleWards().map((w) => `<option value="${w.id}" ${u && u.ward_id === w.id ? "selected" : ""}>${SD.esc(w.name_hi)}</option>`).join("")}</select>
    <label>${SD.esc(t("shg"))}</label><input name="shg_name" value="${SD.esc(u ? u.shg_name || "" : "")}">
    ${villageBoxes ? `<label>${SD.esc(t("assigned_villages"))}</label><div>${villageBoxes}</div>` : ""}
    <label>${SD.esc(t("set_pin"))}</label><input name="pin" inputmode="numeric">
    <button class="btn" type="submit">${SD.esc(t("save"))}</button></form>`, () => {
    SD.$("#uf").onsubmit = async (e) => {
      e.preventDefault(); const f = new FormData(e.target);
      const assignments = [...document.querySelectorAll("#uf [name=asg]:checked")].map((el) => ({
        village_id: el.value, ward_id: el.dataset.ward,
      }));
      const body = {
        id: u && u.id, name: f.get("name"), phone: f.get("phone"), role: f.get("role"),
        block_id: f.get("block_id") || null, ward_id: f.get("ward_id") || null,
        shg_name: f.get("shg_name") || null, aadhaar: f.get("aadhaar") || null,
        district_id: f.get("district_id") || SD.S.user.district_id || null,
        assignments,
      };
      if (f.get("pin")) body.pin = f.get("pin");
      try { await SD.api("/api/users", { method: "POST", body: JSON.stringify(body) }); SD.closeSheet(); SD.toast(t("saved")); SD.screens.users(); }
      catch (err) { SD.toast(err.message); }
    };
  });
};
