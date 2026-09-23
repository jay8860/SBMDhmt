SD.screens.field = function () {
  const items = [
    ["directory", "🏛", t("directory")],
    ["grievances", "📣", t("grievance")],
    ["hotspots", "📍", t("hotspots")],
    ["cleanliness", "📸", t("cleanliness")],
    ["ihhl", "🚽", t("ihhl")],
    ["monitoring", "🏫", t("monitoring")],
    ["greywater", "💧", t("greywater")],
  ];
  SD.shell(`${SD.statusHTML()}<div class="card"><h3>${SD.esc(t("field"))}</h3>
    <div class="list">${items.map(([k, i, l]) => `<div class="item" data-go="${k}" role="button"><div class="av">${i}</div><div class="bd"><div class="t">${SD.esc(l)}</div></div><span>›</span></div>`).join("")}</div></div>`);
  SD.appEl().querySelectorAll("[data-go]").forEach((el) => (el.onclick = () => { SD.S.tab = el.dataset.go; SD.render(); }));
};
SD.screens.directory = function () {
  const items = [
    ["gp", "🏛", t("gp_profile")],
    ["villages", "🏘️", t("villages")],
    ["schools", "🏫", t("schools")],
    ["anganwadis", "🧸", t("anganwadis")],
    ["buildings", "🏢", t("buildings")],
    ["assets", "🏗", t("assets")],
  ];
  SD.shell(`${SD.statusHTML()}<div class="card"><h3>${SD.esc(t("directory"))}</h3>
    <div class="list">${items.map(([k, i, l]) => `<div class="item" data-go="${k}" role="button"><div class="av">${i}</div><div class="bd"><div class="t">${SD.esc(l)}</div></div><span>›</span></div>`).join("")}</div></div>`);
  SD.appEl().querySelectorAll("[data-go]").forEach((el) => (el.onclick = () => { SD.S.tab = el.dataset.go; SD.render(); }));
};
