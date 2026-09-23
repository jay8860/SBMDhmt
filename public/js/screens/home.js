SD.screens.home = function () {
  if (!SD.isField(SD.S.user)) return SD.screens.dashboard();
  const wid = SD.myWardId();
  const mine = SD.S.data.households.filter((h) => h.ward_id === wid && Number(h.active) !== 0);
  const td = SD.todayStr();
  const doneIds = new Set(SD.S.data.collections.filter((c) => c.service_date === td && c.ward_id === wid).map((c) => c.household_id));
  const feesToday = SD.S.data.payments.filter((p) => (p.ts || "").slice(0, 10) === td && p.user_id === SD.S.user.id).reduce((s, p) => s + SD.num(p.amount), 0);
  const att = SD.S.data.attendance.find((a) => a.user_id === SD.S.user.id && a.service_date === td);
  const pct = mine.length ? Math.round((doneIds.size / mine.length) * 100) : 0;
  const openGrv = SD.S.data.grievances.filter((g) => g.ward_id === wid && g.status !== "resolved").length;
  SD.shell(`${SD.statusHTML()}
    <div class="card"><h3>${SD.esc(t("attendance"))}</h3>
      ${att && att.out_ts ? `<div class="tag">✔ ${SD.esc(t("punched_out", { t: SD.hhmm(att.out_ts) }))}</div>`
        : att ? `<button class="btn sec" id="punchOut">${SD.esc(t("punch_out"))}</button>`
        : `<button class="btn" id="punchIn">🕖 ${SD.esc(t("punch_in"))}</button>`}</div>
    <div class="kpis">
      <div class="kpi green"><div class="v">${doneIds.size}<span style="font-size:14px;color:var(--ink3)"> / ${mine.length}</span></div><div class="l">${SD.esc(t("today_covered"))}</div><div class="bar" style="margin-top:8px"><i style="width:${pct}%"></i></div></div>
      <div class="kpi amber"><div class="v">${Math.max(0, mine.length - doneIds.size)}</div><div class="l">${SD.esc(t("pending_today"))}</div></div>
      <div class="kpi blue"><div class="v">${SD.inr(feesToday)}</div><div class="l">${SD.esc(t("fees_today"))}</div></div>
      <div class="kpi red"><div class="v">${openGrv}</div><div class="l">${SD.esc(t("grv_open"))}</div></div>
    </div>
    <button class="btn big" id="goScan">📷 ${SD.esc(t("scan_qr"))}</button>
    <div style="height:12px"></div><div class="row">
      <button class="btn sec" id="qFee">💵 ${SD.esc(t("collect_fee"))}</button>
      <button class="btn sec" id="qGrv">📣 ${SD.esc(t("new_grievance"))}</button>
    </div>`);
  const punch = async (kind) => {
    const g = await SD.getGPS();
    const rec = att ? Object.assign({}, att) : { id: SD.uuid(), user_id: SD.S.user.id, ward_id: wid, service_date: td, in_ts: null, out_ts: null };
    if (kind === "in") rec.in_ts = SD.nowISO(); else rec.out_ts = SD.nowISO();
    if (g) { rec.lat = g.lat; rec.lng = g.lng; }
    SD.put("attendance", rec); SD.render();
  };
  if (SD.$("#punchIn")) SD.$("#punchIn").onclick = () => punch("in");
  if (SD.$("#punchOut")) SD.$("#punchOut").onclick = () => punch("out");
  SD.$("#goScan").onclick = () => { SD.S.tab = "scan"; SD.render(); };
  SD.$("#qFee").onclick = () => SD.pickHousehold((h) => SD.feeSheet(h));
  SD.$("#qGrv").onclick = () => SD.grievanceSheet();
};
