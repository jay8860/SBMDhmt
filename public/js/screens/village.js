SD.screens.villages = function () {
  const rows = (SD.S.data.villages || []).filter((v) => SD.visibleWards().some((w) => w.id === v.ward_id));
  SD.listScreen(t("villages"), rows.map((v) => ({ rec: v, html: SD.item(v.name_hi, `${t("families")} ${v.fam_total || 0} · ${t("population")} ${v.pop_total || 0}`) })),
    () => SD.villageForm(null), (v) => SD.villageForm(v));
};
SD.villageForm = function (v) {
  SD.sheet(v ? t("edit") : t("add"), `<form id="vf">
    <label>${SD.esc(t("name"))}</label><input name="name_hi" required value="${SD.esc(v ? v.name_hi : "")}">
    <label>${SD.esc(t("ward"))}</label>${SD.wardSelect("ward_id", (v && v.ward_id) || SD.myWardId())}
    <div class="row"><div><label>${SD.esc(t("fam_st"))}</label><input name="fam_st" type="number" value="${v ? v.fam_st || 0 : 0}"></div>
      <div><label>${SD.esc(t("fam_sc"))}</label><input name="fam_sc" type="number" value="${v ? v.fam_sc || 0 : 0}"></div></div>
    <div class="row"><div><label>${SD.esc(t("fam_obc"))}</label><input name="fam_obc" type="number" value="${v ? v.fam_obc || 0 : 0}"></div>
      <div><label>${SD.esc(t("fam_gen"))}</label><input name="fam_gen" type="number" value="${v ? v.fam_gen || 0 : 0}"></div></div>
    <div class="row"><div><label>${SD.esc(t("pop_st"))}</label><input name="pop_st" type="number" value="${v ? v.pop_st || 0 : 0}"></div>
      <div><label>${SD.esc(t("pop_sc"))}</label><input name="pop_sc" type="number" value="${v ? v.pop_sc || 0 : 0}"></div></div>
    <div class="row"><div><label>${SD.esc(t("pop_obc"))}</label><input name="pop_obc" type="number" value="${v ? v.pop_obc || 0 : 0}"></div>
      <div><label>${SD.esc(t("pop_gen"))}</label><input name="pop_gen" type="number" value="${v ? v.pop_gen || 0 : 0}"></div></div>
    <p class="hint">${SD.esc(t("census"))}: totals auto</p>
    <button class="btn" type="submit">${SD.esc(t("save"))}</button></form>`, () => {
    SD.$("#vf").onsubmit = (e) => {
      e.preventDefault(); const f = new FormData(e.target);
      const n = (k) => SD.num(f.get(k));
      SD.put("villages", {
        id: v ? v.id : SD.uuid(), ward_id: f.get("ward_id"), name_hi: f.get("name_hi"), name_en: f.get("name_hi"),
        fam_st: n("fam_st"), fam_sc: n("fam_sc"), fam_obc: n("fam_obc"), fam_gen: n("fam_gen"),
        fam_total: n("fam_st") + n("fam_sc") + n("fam_obc") + n("fam_gen"),
        pop_st: n("pop_st"), pop_sc: n("pop_sc"), pop_obc: n("pop_obc"), pop_gen: n("pop_gen"),
        pop_total: n("pop_st") + n("pop_sc") + n("pop_obc") + n("pop_gen"), updated_at: SD.nowISO(),
      });
      SD.closeSheet(); SD.toast(t("saved")); SD.render();
    };
  });
};
