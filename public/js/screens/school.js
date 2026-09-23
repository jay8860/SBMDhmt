SD.screens.schools = function () {
  const rows = (SD.S.data.schools || []).filter((s) => SD.visibleWards().some((w) => w.id === s.ward_id));
  const kinds = (s) => `<label>${SD.esc(t("category"))}</label><select name="kind">
    <option value="boys" ${s && s.kind === "boys" ? "selected" : ""}>${SD.esc(t("boys"))}</option>
    <option value="girls" ${s && s.kind === "girls" ? "selected" : ""}>${SD.esc(t("girls"))}</option>
    <option value="coed" ${!s || s.kind === "coed" ? "selected" : ""}>${SD.esc(t("coed"))}</option></select>`;
  const vil = (id) => { const v = SD.villageById(id); return v ? (window.LANG === "hi" ? v.name_hi : v.name_en) : ""; };
  SD.listScreen(
    t("schools"),
    rows.map((s) => ({ rec: s, html: SD.item(s.name, `${t(s.kind || "coed")} · ${vil(s.village_id) || SD.wardName(s.ward_id)} · ${t("toilets_fn")} ${s.toilets_functional || 0}/${s.toilets_total || 0}`) })),
    () => SD.facilityForm("schools", null, kinds(null)),
    (s) => SD.facilityForm("schools", s, kinds(s)),
    rows.map((s) => ({ lat: s.lat, lng: s.lng, label: s.name }))
  );
};
