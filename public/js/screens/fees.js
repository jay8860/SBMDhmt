SD.duesOf = function (h) {
  const slab = SD.num(h.fee_slab); if (!slab) return 0;
  const created = (h.created_at || SD.nowISO()).slice(0, 7);
  const [ay, am] = created.split("-").map(Number), [by, bm] = SD.todayStr().slice(0, 7).split("-").map(Number);
  const months = Math.max(0, (by - ay) * 12 + (bm - am)) + 1;
  const paid = SD.S.data.payments.filter((p) => p.household_id === h.id).reduce((s, p) => s + SD.num(p.amount), 0);
  return Math.max(0, Math.min(months, 12) * slab - paid);
};
SD.feeSheet = function (h) {
  const due = SD.duesOf(h);
  SD.sheet(t("collect_fee"), `
    <div class="item" style="cursor:default"><div class="av">₹</div><div class="bd"><div class="t">${SD.esc(h.head_name)}</div>
      <div class="s">${SD.esc(t("fee_slab"))} ${SD.inr(h.fee_slab)}</div></div>
      ${due > 0 ? `<span class="tag amber">${SD.esc(t("dues"))} ${SD.inr(due)}</span>` : ""}</div>
    <form id="feef">
      <label>${SD.esc(t("amount"))}</label><input name="amount" type="number" min="1" value="${SD.num(h.fee_slab) || 30}" required>
      <label>${SD.esc(t("period"))}</label><input name="period" type="month" value="${SD.todayStr().slice(0, 7)}" required>
      <label>${SD.esc(t("mode"))}</label>
      <div class="chips"><button type="button" class="chip on" data-m="cash">💵 ${SD.esc(t("cash"))}</button>
        <button type="button" class="chip" data-m="upi">📱 ${SD.esc(t("upi"))}</button></div>
      <div style="height:14px"></div><div class="row"><button type="button" class="btn gray" onclick="closeSheet()">${SD.esc(t("cancel"))}</button>
      <button class="btn" type="submit">✔ ${SD.esc(t("save"))}</button></div>
    </form>`, (root) => {
    let mode = "cash";
    root.querySelectorAll("[data-m]").forEach((b) => (b.onclick = () => { mode = b.dataset.m; root.querySelectorAll("[data-m]").forEach((x) => x.classList.toggle("on", x === b)); }));
    SD.$("#feef").onsubmit = async (e) => {
      e.preventDefault();
      const f = new FormData(e.target); const g = await SD.getGPS();
      const receipt = "RCP" + Date.now().toString().slice(-8);
      SD.put("payments", {
        id: SD.uuid(), household_id: h.id, ward_id: h.ward_id, user_id: SD.S.user.id,
        amount: SD.num(f.get("amount")), period: f.get("period"), mode, receipt_no: receipt,
        ts: SD.nowISO(), lat: g && g.lat, lng: g && g.lng,
      });
      SD.closeSheet(); SD.toast(t("fee_saved", { r: receipt })); SD.render();
    };
  });
};
