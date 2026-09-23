SD.screens.reports = function () {
  const ents = [
    ["collections", t("collection")], ["payments", t("fee")], ["households", t("households")],
    ["grievances", t("grievance")], ["assets", t("assets")], ["attendance", t("attendance")],
    ["villages", t("villages")], ["ihhl", t("ihhl")], ["schools", t("schools")],
    ["anganwadis", t("anganwadis")], ["hotspots", t("hotspots")], ["buildings", t("buildings")],
  ];
  SD.shell(`${SD.statusHTML()}<div class="card"><h3>⬇️ ${SD.esc(t("export"))}</h3>
    <div class="row"><div><label>${SD.esc(t("from"))}</label><input type="date" id="ef" value="${SD.esc(SD.S.filters.from || new Date(Date.now() - 29 * 864e5).toISOString().slice(0, 10))}"></div>
    <div><label>${SD.esc(t("to"))}</label><input type="date" id="et" value="${SD.esc(SD.S.filters.to || SD.todayStr())}"></div></div>
    ${!SD.isField(SD.S.user) ? `<label>${SD.esc(t("block"))}</label><select id="eb"><option value="">${SD.esc(t("all_blocks"))}</option>${SD.visibleBlocks().map((b) => `<option value="${b.id}">${SD.esc(b.name_hi)}</option>`).join("")}</select>` : ""}
    <label>${SD.esc(t("ward"))}</label><select id="ew"><option value="">${SD.esc(t("all_wards"))}</option>${SD.visibleWards().map((w) => `<option value="${w.id}">${SD.esc(w.name_hi)}</option>`).join("")}</select>
    <div class="list" style="margin-top:12px">${ents.map(([k, l]) => `<div class="item" style="cursor:default"><div class="bd"><div class="t">${SD.esc(l)}</div></div>
      <button class="btn sm gray" data-x="${k}" data-fmt="csv">CSV</button>
      <button class="btn sm" data-x="${k}" data-fmt="xlsx">Excel</button>
      <button class="btn sm sec" data-x="${k}" data-fmt="pdf">PDF</button></div>`).join("")}</div></div>
    <div class="card"><h3>${SD.esc(t("print_qr"))}</h3>
      <select id="qw">${SD.visibleWards().map((w) => `<option value="${w.id}">${SD.esc(w.name_hi)}</option>`).join("")}</select>
      <div style="height:10px"></div><button class="btn sec" id="qgo">${SD.esc(t("print"))}</button></div>`);
  SD.appEl().querySelectorAll("[data-x]").forEach((b) => (b.onclick = () => {
    const qs = new URLSearchParams({ token: SD.S.token, from: SD.$("#ef").value, to: SD.$("#et").value });
    if (SD.$("#ew").value) qs.set("ward_id", SD.$("#ew").value);
    if (SD.$("#eb") && SD.$("#eb").value) qs.set("block_id", SD.$("#eb").value);
    window.open(`/api/export/${b.dataset.x}.${b.dataset.fmt}?${qs}`, "_blank");
  }));
  SD.$("#qgo").onclick = () => window.open(`/api/qr-sheet?ward_id=${encodeURIComponent(SD.$("#qw").value)}&token=${encodeURIComponent(SD.S.token)}`, "_blank");
};
