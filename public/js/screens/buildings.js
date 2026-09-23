SD.screens.buildings = function () {
  const rows = (SD.S.data.buildings || []).filter((s) => SD.visibleWards().some((w) => w.id === s.ward_id));
  const kinds = (s) => `<label>${SD.esc(t("category"))}</label><select name="bkind">
    <option value="gov" ${!s || s.kind === "gov" ? "selected" : ""}>${SD.esc(t("gov_building"))}</option>
    <option value="community" ${s && s.kind === "community" ? "selected" : ""}>${SD.esc(t("community_building"))}</option></select>`;
  SD.listScreen(
    t("buildings"),
    rows.map((s) => ({ rec: s, html: SD.item(s.name, `${t(s.kind === "community" ? "community_building" : "gov_building")} · ${t("toilets_fn")} ${s.toilets_functional || 0}/${s.toilets_total || 0}`) })),
    () => SD.facilityForm("buildings", null, kinds(null)),
    (s) => SD.facilityForm("buildings", s, kinds(s)),
    rows.map((s) => ({ lat: s.lat, lng: s.lng, label: s.name }))
  );
};
