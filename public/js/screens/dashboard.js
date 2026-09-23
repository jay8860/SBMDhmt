SD.screens.dashboard = async function () {
  SD.shell(`${SD.statusHTML()}<div class="card"><div class="empty">⏳</div></div>`);
  let d = null;
  if (navigator.onLine) {
    try {
      const qs = new URLSearchParams();
      if (SD.S.filters.block_id) qs.set("block_id", SD.S.filters.block_id);
      if (SD.S.filters.ward_id) qs.set("ward_id", SD.S.filters.ward_id);
      if (SD.S.filters.from) qs.set("from", SD.S.filters.from);
      if (SD.S.filters.to) qs.set("to", SD.S.filters.to);
      d = await SD.api("/api/dashboard?" + qs.toString());
      SD.S.dash = d;
    } catch (e) { console.warn(e); }
  }
  if (!d) d = SD.S.dash || { kpi: {}, grievances: [], daily: [], by_ward: [], assets: [], ihhl: [], hotspots: [], census: {} };
  const k = d.kpi || {};
  const blocks = SD.visibleBlocks();
  const assetsHtml = (d.assets || []).map((a) => `<tr><td>${SD.esc(t("a_" + a.asset_type) || a.asset_type)}</td><td>${SD.esc(t(a.condition))}</td><td class="n">${a.n}</td></tr>`).join("");
  const ihhlN = (d.ihhl || []).reduce((s, x) => s + Number(x.n || 0), 0);
  const ihhlDone = (d.ihhl || []).filter((x) => ["completed", "geotagged", "incentive_paid"].includes(x.status)).reduce((s, x) => s + Number(x.n || 0), 0);
  const hotN = (d.hotspots || []).reduce((s, x) => s + Number(x.n || 0), 0);
  const waste = Math.round(((k.wet_kg || 0) + (k.dry_kg || 0) + (k.hazard_kg || 0)) * 10) / 10;
  SD.shell(`${SD.statusHTML()}
    <div class="card"><div class="row"><div><label>${SD.esc(t("block"))}</label>
      <select id="fb"><option value="">${SD.esc(t("all_blocks"))}</option>${blocks.map((b) => `<option value="${b.id}" ${SD.S.filters.block_id === b.id ? "selected" : ""}>${SD.esc(b.name_hi)}</option>`).join("")}</select></div>
      <div><label>${SD.esc(t("ward"))}</label><select id="fw"><option value="">${SD.esc(t("all_wards"))}</option>${SD.visibleWards().map((w) => `<option value="${w.id}" ${SD.S.filters.ward_id === w.id ? "selected" : ""}>${SD.esc(w.name_hi)}</option>`).join("")}</select></div></div>
      <button class="btn sm sec" id="fapply" style="width:100%;margin-top:10px">${SD.esc(t("apply"))}</button></div>
    <div class="kpis">
      <div class="kpi green"><div class="v">${k.today_coverage_pct || 0}%</div><div class="l">${SD.esc(t("today_covered"))}</div></div>
      <div class="kpi blue"><div class="v">${(k.households || 0).toLocaleString("en-IN")}</div><div class="l">${SD.esc(t("total_households"))}</div></div>
      <div class="kpi green"><div class="v">${k.segregation_pct || 0}%</div><div class="l">${SD.esc(t("segregation"))}</div></div>
      <div class="kpi amber"><div class="v">${SD.inr(k.fees_collected)}</div><div class="l">${SD.esc(t("fees_collected"))}</div></div>
      <div class="kpi blue"><div class="v">${k.paying_families || 0}</div><div class="l">${SD.esc(t("paying_families"))}</div></div>
      <div class="kpi amber"><div class="v">${k.paying_shops || 0}/${k.shops || 0}</div><div class="l">${SD.esc(t("paying_shops"))}</div></div>
      <div class="kpi green"><div class="v">${k.schools || 0}</div><div class="l">${SD.esc(t("schools"))}</div></div>
      <div class="kpi blue"><div class="v">${k.anganwadis || 0}</div><div class="l">${SD.esc(t("anganwadis"))}</div></div>
      <div class="kpi green"><div class="v">${ihhlDone}/${ihhlN}</div><div class="l">${SD.esc(t("ihhl"))}</div></div>
      <div class="kpi red"><div class="v">${hotN}</div><div class="l">${SD.esc(t("hotspots"))}</div></div>
      <div class="kpi amber"><div class="v">${waste}</div><div class="l">${SD.esc(t("waste_kg"))}</div></div>
      <div class="kpi blue"><div class="v">${(d.census && d.census.population) || 0}</div><div class="l">${SD.esc(t("population"))}</div></div>
      <div class="kpi green"><div class="v">${(d.census && d.census.families) || 0}</div><div class="l">${SD.esc(t("families"))}</div></div>
    </div>
    <div class="card"><h3>${SD.esc(t("census"))}</h3><div class="scroll"><table>
      <tr><th>ST</th><th>SC</th><th>OBC</th><th>${SD.esc(t("fam_gen"))}</th></tr>
      <tr><td class="n">${(d.census && d.census.fam_st) || 0}</td><td class="n">${(d.census && d.census.fam_sc) || 0}</td><td class="n">${(d.census && d.census.fam_obc) || 0}</td><td class="n">${(d.census && d.census.fam_gen) || 0}</td></tr>
    </table></div></div>
    <div class="card"><h3>${SD.esc(t("ihhl"))}</h3><div class="scroll"><table><tr><th>${SD.esc(t("status"))}</th><th class="n">N</th></tr>
      ${(d.ihhl || []).map((x) => `<tr><td>${SD.esc(t(x.status) || x.status)}</td><td class="n">${x.n}</td></tr>`).join("") || `<tr><td colspan="2">${SD.esc(t("no_data"))}</td></tr>`}</table></div></div>
    <div class="card"><h3>${SD.esc(t("hotspots"))}</h3><div class="scroll"><table><tr><th>${SD.esc(t("status"))}</th><th class="n">N</th></tr>
      ${(d.hotspots || []).map((x) => `<tr><td>${SD.esc(t(x.workflow) || x.workflow)}</td><td class="n">${x.n}</td></tr>`).join("") || `<tr><td colspan="2">${SD.esc(t("no_data"))}</td></tr>`}</table></div></div>
    <div class="card"><h3>${SD.esc(t("assets"))}</h3><div class="scroll"><table><tr><th>${SD.esc(t("asset_type"))}</th><th>${SD.esc(t("condition"))}</th><th class="n">N</th></tr>
      ${assetsHtml || `<tr><td colspan="3">${SD.esc(t("no_data"))}</td></tr>`}</table></div></div>
    <div class="card"><h3>${SD.esc(t("ward_wise"))}</h3><div class="scroll"><table>
      <tr><th>${SD.esc(t("ward"))}</th><th class="n">${SD.esc(t("households"))}</th><th class="n">${SD.esc(t("today"))}</th></tr>
      ${(d.by_ward || []).filter((w) => w.households > 0).slice(0, 40).map((w) => `<tr><td>${SD.esc(w.name_hi)}</td><td class="n">${w.households}</td><td class="n">${w.covered_today}</td></tr>`).join("")}</table></div></div>`);
  SD.$("#fapply").onclick = () => { SD.S.filters.block_id = SD.$("#fb").value; SD.S.filters.ward_id = SD.$("#fw").value; SD.screens.dashboard(); };
};
