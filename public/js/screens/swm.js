SD.screens.swm = function () {
  const wid = SD.S.filters.ward_id || SD.myWardId() || (SD.visibleWards()[0] && SD.visibleWards()[0].id);
  const swm = (SD.S.data.swm_gp || []).find((s) => s.ward_id === wid) || {};
  const sales = (SD.S.data.waste_sales || []).filter((s) => s.ward_id === wid);
  const pwmu = (SD.S.data.pwmu_shipments || []).filter((s) => s.ward_id === wid);
  const hon = (SD.S.data.honorarium || []).filter((s) => s.ward_id === wid);
  const cats = (SD.S.data.waste_category_totals || []).filter((s) => s.ward_id === wid);
  const sheds = (SD.S.data.assets || []).filter((a) => a.ward_id === wid && (a.asset_type === "SLRM" || a.asset_type === "MCF"));
  SD.shell(`${SD.statusHTML()}<div class="card"><label>${SD.esc(t("ward"))}</label>${SD.wardSelect("wid", wid)}</div>
    <div class="card"><h3>${SD.esc(t("swm"))}</h3><form id="sf">
      <label>${SD.esc(t("shed_available"))}</label><select name="shed_available"><option value="0">${SD.esc(t("no"))}</option><option value="1" ${Number(swm.shed_available) ? "selected" : ""}>${SD.esc(t("yes"))}</option></select>
      <label>${SD.esc(t("shed_usage"))}</label><input name="shed_usage" value="${SD.esc(swm.shed_usage || "")}">
      ${sheds.length ? `<p class="hint">${SD.esc(t("a_SLRM"))}/${SD.esc(t("a_MCF"))}: ${sheds.map((s) => SD.esc(s.name)).join(" · ")}</p>` : ""}
      <label>${SD.esc(t("dtd"))}</label><select name="dtd_happening"><option value="0">${SD.esc(t("no"))}</option><option value="1" ${Number(swm.dtd_happening) ? "selected" : ""}>${SD.esc(t("yes"))}</option></select>
      <label>${SD.esc(t("reason"))}</label><input name="dtd_reason" value="${SD.esc(swm.dtd_reason || "")}">
      <div class="row"><div><label>${SD.esc(t("dtd_freq"))}</label><input name="dtd_frequency" value="${SD.esc(swm.dtd_frequency || "")}"></div>
        <div><label>${SD.esc(t("days_week"))}</label><input name="dtd_days_per_week" type="number" min="0" max="7" value="${swm.dtd_days_per_week || ""}"></div></div>
      <label>${SD.esc(t("segregation"))}</label><select name="segregation_happens"><option value="0">${SD.esc(t("no"))}</option><option value="1" ${Number(swm.segregation_happens) ? "selected" : ""}>${SD.esc(t("yes"))}</option></select>
      <label>${SD.esc(t("reason"))}</label><input name="segregation_reason" value="${SD.esc(swm.segregation_reason || "")}">
      <label>${SD.esc(t("location"))}</label><input name="segregation_location" value="${SD.esc(swm.segregation_location || "")}">
      <label>${SD.esc(t("kit"))}</label><select name="kit_available"><option value="0">${SD.esc(t("no"))}</option><option value="1" ${Number(swm.kit_available) ? "selected" : ""}>${SD.esc(t("yes"))}</option></select>
      <label>${SD.esc(t("status"))}</label><input name="kit_status" value="${SD.esc(swm.kit_status || "")}">
      <button class="btn" type="submit">${SD.esc(t("save"))}</button></form></div>
    <div class="card"><h3>${SD.esc(t("waste_kg"))}</h3>
      <form id="cf2">
        <label>${SD.esc(t("period"))}</label><input name="period" type="month" value="${SD.todayStr().slice(0, 7)}">
        <div class="row"><input name="plastic_kg" type="number" step="0.1" placeholder="${SD.esc(t("plastic"))}">
          <input name="metal_kg" type="number" step="0.1" placeholder="${SD.esc(t("metal"))}"></div>
        <div class="row"><input name="glass_kg" type="number" step="0.1" placeholder="${SD.esc(t("glass"))}">
          <input name="mixed_kg" type="number" step="0.1" placeholder="${SD.esc(t("mixed"))}"></div>
        <button class="btn sm" type="submit">${SD.esc(t("save"))}</button></form>
      <p class="hint">${cats.map((c) => `${c.period}: P${c.plastic_kg || 0} M${c.metal_kg || 0} G${c.glass_kg || 0} X${c.mixed_kg || 0}`).join(" · ") || t("no_data")}</p></div>
    <div class="card"><h3>${SD.esc(t("scrap"))}</h3><form id="sale">
      <div class="row"><input name="waste_type" placeholder="${SD.esc(t("category"))}"><input name="qty_kg" type="number" step="0.1" placeholder="kg"></div>
      <div class="row"><input name="sale_date" type="date"><input name="buyer" placeholder="${SD.esc(t("buyer"))}"></div>
      <button class="btn sm" type="submit">${SD.esc(t("add"))}</button></form>
      <div class="list">${sales.map((s) => SD.item(s.waste_type, `${s.qty_kg} kg · ${s.buyer || ""} · ${s.sale_date || ""}`)).join("") || `<div class="empty">${SD.esc(t("no_data"))}</div>`}</div></div>
    <div class="card"><h3>${SD.esc(t("pwmu"))}</h3><form id="pw">
      <div class="row"><input name="qty" type="number" step="0.1" placeholder="kg"><input name="ship_date" type="date"></div>
      <input name="destination" placeholder="${SD.esc(t("destination"))}">
      <button class="btn sm" type="submit">${SD.esc(t("add"))}</button></form>
      <div class="list">${pwmu.map((s) => SD.item(s.destination, `${s.qty} ${s.unit || "kg"} · ${s.ship_date || ""}`)).join("") || `<div class="empty">${SD.esc(t("no_data"))}</div>`}</div></div>
    <div class="card"><h3>${SD.esc(t("honorarium"))}</h3><form id="hf">
      <label>${SD.esc(t("yes"))}/${SD.esc(t("no"))}</label>
      <select name="paid"><option value="1">${SD.esc(t("yes"))}</option><option value="0">${SD.esc(t("no"))}</option></select>
      <div class="row"><input name="amount_per_person" id="hAmt" type="number" placeholder="₹ / person">
        <input name="people" id="hPeople" type="number" placeholder="${SD.esc(t("people"))}">
        <input name="months" id="hMonths" type="number" placeholder="${SD.esc(t("months"))}"></div>
      <input name="reason" placeholder="${SD.esc(t("reason"))}">
      <p class="hint" id="honTot">${SD.esc(t("honorarium"))}: ₹0</p>
      <button class="btn" type="submit">${SD.esc(t("save"))}</button></form>
      <div class="list">${hon.map((h) => SD.item(SD.inr(h.total), `${h.amount_per_person || 0} × ${h.people || 0} × ${h.months || 0} · ${h.paid ? t("yes") : t("no")} · ${h.period || ""}`)).join("") || `<div class="empty">${SD.esc(t("no_data"))}</div>`}</div></div>`);
  SD.$("select[name=wid]").onchange = (e) => { SD.S.filters.ward_id = e.target.value; SD.screens.swm(); };
  const honLive = () => {
    const tot = SD.num(SD.$("#hAmt").value) * SD.num(SD.$("#hPeople").value) * SD.num(SD.$("#hMonths").value);
    const el = SD.$("#honTot"); if (el) el.textContent = `${t("honorarium")}: ${SD.inr(tot)}`;
  };
  ["#hAmt", "#hPeople", "#hMonths"].forEach((sel) => { const el = SD.$(sel); if (el) el.oninput = honLive; });
  SD.$("#sf").onsubmit = (e) => {
    e.preventDefault(); const f = new FormData(e.target);
    SD.put("swm_gp", {
      id: swm.id || SD.uuid(), ward_id: wid,
      shed_available: f.get("shed_available") === "1" ? 1 : 0, shed_usage: f.get("shed_usage") || null,
      dtd_happening: f.get("dtd_happening") === "1" ? 1 : 0, dtd_reason: f.get("dtd_reason") || null,
      dtd_frequency: f.get("dtd_frequency") || null, dtd_days_per_week: SD.num(f.get("dtd_days_per_week")),
      segregation_happens: f.get("segregation_happens") === "1" ? 1 : 0,
      segregation_reason: f.get("segregation_reason") || null,
      segregation_location: f.get("segregation_location") || null,
      kit_available: f.get("kit_available") === "1" ? 1 : 0, kit_status: f.get("kit_status") || null, updated_at: SD.nowISO(),
    });
    SD.toast(t("saved")); SD.render();
  };
  SD.$("#cf2").onsubmit = (e) => {
    e.preventDefault(); const f = new FormData(e.target);
    const period = f.get("period");
    const prev = cats.find((c) => c.period === period);
    SD.put("waste_category_totals", {
      id: prev ? prev.id : SD.uuid(), ward_id: wid, period,
      plastic_kg: SD.num(f.get("plastic_kg")), metal_kg: SD.num(f.get("metal_kg")),
      glass_kg: SD.num(f.get("glass_kg")), mixed_kg: SD.num(f.get("mixed_kg")), updated_at: SD.nowISO(),
    });
    SD.toast(t("saved")); SD.render();
  };
  SD.$("#sale").onsubmit = (e) => {
    e.preventDefault(); const f = new FormData(e.target);
    SD.put("waste_sales", { id: SD.uuid(), ward_id: wid, waste_type: f.get("waste_type"), qty_kg: SD.num(f.get("qty_kg")), sale_date: f.get("sale_date"), buyer: f.get("buyer"), created_by: SD.S.user.id, created_at: SD.nowISO() });
    SD.render();
  };
  SD.$("#pw").onsubmit = (e) => {
    e.preventDefault(); const f = new FormData(e.target);
    SD.put("pwmu_shipments", { id: SD.uuid(), ward_id: wid, qty: SD.num(f.get("qty")), unit: "kg", ship_date: f.get("ship_date"), destination: f.get("destination"), created_by: SD.S.user.id, created_at: SD.nowISO() });
    SD.render();
  };
  SD.$("#hf").onsubmit = (e) => {
    e.preventDefault(); const f = new FormData(e.target);
    const amt = SD.num(f.get("amount_per_person")), people = SD.num(f.get("people")), months = SD.num(f.get("months"));
    SD.put("honorarium", {
      id: SD.uuid(), ward_id: wid, paid: f.get("paid") === "1" ? 1 : 0, reason: f.get("reason") || null,
      amount_per_person: amt, people, months, total: amt * people * months, period: SD.todayStr().slice(0, 7), updated_at: SD.nowISO(),
    });
    SD.render();
  };
};
