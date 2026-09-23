SD.screens.anganwadis = function () {
  const rows = (SD.S.data.anganwadis || []).filter((s) => SD.visibleWards().some((w) => w.id === s.ward_id));
  const vil = (id) => { const v = SD.villageById(id); return v ? (window.LANG === "hi" ? v.name_hi : v.name_en) : ""; };
  SD.listScreen(
    t("anganwadis"),
    rows.map((s) => ({ rec: s, html: SD.item(s.name, `${vil(s.village_id) || SD.wardName(s.ward_id)} · ${t("toilets_fn")} ${s.toilets_functional || 0}/${s.toilets_total || 0}`) })),
    () => SD.facilityForm("anganwadis", null),
    (s) => SD.facilityForm("anganwadis", s),
    rows.map((s) => ({ lat: s.lat, lng: s.lng, label: s.name }))
  );
};
