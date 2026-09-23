window.SD = window.SD || {};
SD.screens = SD.screens || {};
SD.LS = { token: "sd_token", user: "sd_user", data: "sd_data", outbox: "sd_outbox", lang: "lang", tab: "sd_tab" };
SD.TABLES = [
  "households", "collections", "payments", "grievances", "assets", "attendance",
  "gp_profiles", "villages", "schools", "anganwadis", "buildings", "ihhl",
  "hotspots", "cleanliness_cases", "monitoring_visits", "greywater_cases",
  "swm_gp", "waste_sales", "pwmu_shipments", "honorarium", "waste_category_totals",
];
function emptyData() {
  const o = { blocks: [], wards: [], states: [], districts: [], notifications: [], assignments: [] };
  SD.TABLES.forEach((t) => { o[t] = []; });
  return o;
}
function emptyOutbox() { const o = {}; SD.TABLES.forEach((t) => (o[t] = [])); return o; }
SD.emptyData = emptyData;
SD.emptyOutbox = emptyOutbox;
SD.S = {
  token: localStorage.getItem(SD.LS.token) || null,
  user: JSON.parse(localStorage.getItem(SD.LS.user) || "null"),
  data: JSON.parse(localStorage.getItem(SD.LS.data) || "null") || emptyData(),
  outbox: JSON.parse(localStorage.getItem(SD.LS.outbox) || "null") || emptyOutbox(),
  tab: localStorage.getItem(SD.LS.tab) || "home",
  syncing: false, online: navigator.onLine, dash: null,
  filters: { block_id: "", ward_id: "", from: "", to: "", q: "" },
};
if (!SD.S.outbox || typeof SD.S.outbox !== "object") SD.S.outbox = emptyOutbox();
SD.TABLES.forEach((t) => {
  if (!Array.isArray(SD.S.data[t])) SD.S.data[t] = [];
  if (!Array.isArray(SD.S.outbox[t])) SD.S.outbox[t] = [];
});
SD.save = {
  data() { try { localStorage.setItem(SD.LS.data, JSON.stringify(SD.S.data)); } catch (e) { console.warn("quota", e); } },
  outbox() { localStorage.setItem(SD.LS.outbox, JSON.stringify(SD.S.outbox)); },
  auth() {
    if (SD.S.token) { localStorage.setItem(SD.LS.token, SD.S.token); localStorage.setItem(SD.LS.user, JSON.stringify(SD.S.user)); }
    else { localStorage.removeItem(SD.LS.token); localStorage.removeItem(SD.LS.user); }
  },
};
SD.pendingCount = () => SD.TABLES.reduce((s, k) => s + (SD.S.outbox[k] || []).length, 0);
SD.isField = (u) => u && (u.role === "didi" || u.role === "swachhagrahi");
SD.roleLabel = (r) => t("role_" + (r === "didi" ? "swachhagrahi" : r));
SD.wardById = (id) => SD.S.data.wards.find((w) => w.id === id);
SD.blockById = (id) => SD.S.data.blocks.find((b) => b.id === id);
SD.hhById = (id) => SD.S.data.households.find((h) => h.id === id);
SD.villageById = (id) => (SD.S.data.villages || []).find((v) => v.id === id);
SD.wardName = (id) => { const w = SD.wardById(id); return w ? (window.LANG === "hi" ? w.name_hi : w.name_en) : "—"; };
SD.blockName = (id) => { const b = SD.blockById(id); return b ? (window.LANG === "hi" ? b.name_hi : b.name_en) : "—"; };
SD.myWardId = () => (SD.S.user && SD.S.user.ward_id) || "";
SD.myWardIds = function () {
  const ids = new Set();
  if (SD.S.user && SD.S.user.ward_id) ids.add(SD.S.user.ward_id);
  (SD.S.data.assignments || []).forEach((a) => { if (a.ward_id) ids.add(a.ward_id); });
  return [...ids];
};
SD.visibleWards = () => {
  if (!SD.S.user) return [];
  if (SD.isField(SD.S.user) || SD.S.user.role === "gp") {
    const ids = new Set(SD.myWardIds());
    return SD.S.data.wards.filter((w) => ids.has(w.id));
  }
  if (SD.S.user.role === "supervisor") return SD.S.data.wards.filter((w) => w.block_id === SD.S.user.block_id);
  if (SD.S.user.role === "admin" && SD.S.user.district_id) {
    return SD.S.data.wards.filter((w) => {
      const b = SD.blockById(w.block_id);
      return b && b.district_id === SD.S.user.district_id;
    });
  }
  return SD.S.data.wards;
};
SD.visibleBlocks = () => {
  if (!SD.S.user) return [];
  if (SD.S.user.role === "admin" || SD.S.user.role === "viewer" || SD.S.user.role === "state_admin") return SD.S.data.blocks;
  return SD.S.data.blocks.filter((b) => b.id === SD.S.user.block_id);
};
SD.put = function (table, rec) {
  const arr = SD.S.data[table] || (SD.S.data[table] = []);
  const i = arr.findIndex((x) => x.id === rec.id);
  if (i >= 0) arr[i] = Object.assign({}, arr[i], rec); else arr.unshift(rec);
  const ob = SD.S.outbox[table] || (SD.S.outbox[table] = []);
  const j = ob.findIndex((x) => x.id === rec.id);
  if (j >= 0) ob[j] = Object.assign({}, ob[j], rec); else ob.push(rec);
  SD.save.data(); SD.save.outbox();
  if (SD.scheduleSync) SD.scheduleSync();
};
