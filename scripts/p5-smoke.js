const http = require("http");
const PORT = process.env.PORT || 3008;

function req(method, path, body, token) {
  return new Promise((res, rej) => {
    const data = body ? JSON.stringify(body) : null;
    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = "Bearer " + token;
    if (data) headers["Content-Length"] = Buffer.byteLength(data);
    const r = http.request({ hostname: "127.0.0.1", port: PORT, path, method, headers }, (rs) => {
      const chunks = [];
      rs.on("data", (c) => chunks.push(c));
      rs.on("end", () => {
        const raw = Buffer.concat(chunks).toString("utf8");
        let json;
        try { json = JSON.parse(raw); } catch (_) { /* html/csv */ }
        res({ status: rs.statusCode, json, raw, type: rs.headers["content-type"] || "" });
      });
    });
    r.on("error", rej);
    if (data) r.write(data);
    r.end();
  });
}

(async () => {
  const gp = await req("POST", "/api/login", { phone: "9000000201", pin: "1234" });
  const gt = gp.json.token;
  const gBoot = await req("GET", "/api/bootstrap", null, gt);
  const wardId = gp.json.user.ward_id;
  console.log("GP", gp.status, gp.json.user.role, wardId, "villages", (gBoot.json.villages || []).length, "schools", (gBoot.json.schools || []).length);

  const swm = await req("PUT", "/api/swm/" + wardId, {
    shed_available: 1, shed_usage: "SLRM + MCF",
    dtd_happening: 1, dtd_reason: "", dtd_frequency: "daily", dtd_days_per_week: 6,
    segregation_happens: 1, segregation_reason: "", segregation_location: "shed",
    kit_available: 1, kit_status: "issued",
  }, gt);
  console.log("SWM", swm.status, swm.json.shed_available, swm.json.dtd_days_per_week, swm.json.kit_status);

  const hon = await req("POST", "/api/honorarium", {
    ward_id: wardId, paid: 1, amount_per_person: 500, people: 4, months: 3, reason: "SHG", total: 1,
  }, gt);
  console.log("HON", hon.status, hon.json.total, hon.json.amount_per_person, hon.json.people, hon.json.months);

  const cat = await req("POST", "/api/waste-categories", {
    ward_id: wardId, period: "2026-09", plastic_kg: 12.5, metal_kg: 3, glass_kg: 1.2, mixed_kg: 8,
  }, gt);
  const cat2 = await req("POST", "/api/waste-categories", {
    ward_id: wardId, period: "2026-09", plastic_kg: 20, metal_kg: 3, glass_kg: 1.2, mixed_kg: 8,
  }, gt);
  console.log("WASTE_KG", cat.status, cat.json.plastic_kg, "merge", cat2.json.id === cat.json.id, cat2.json.plastic_kg);

  const sale = await req("POST", "/api/waste-sales", {
    ward_id: wardId, waste_type: "plastic", qty_kg: 15, sale_date: "2026-09-20", buyer: "PWMU",
  }, gt);
  const pw = await req("POST", "/api/pwmu", {
    ward_id: wardId, qty: 15, unit: "kg", ship_date: "2026-09-21", destination: "Raipur",
  }, gt);
  console.log("SCRAP_PWMU", sale.status, sale.json.qty_kg, pw.status, pw.json.destination);

  const pack = await req("GET", "/api/swm/" + wardId, null, gt);
  console.log("SWM_GET", pack.status, !!pack.json.swm, pack.json.sales.length, pack.json.pwmu.length, pack.json.honorarium.length, pack.json.categories.length);

  const field = await req("POST", "/api/login", { phone: "9000000101", pin: "1234" });
  const ft = field.json.token;
  const fBoot = await req("GET", "/api/bootstrap", null, ft);
  const hh = fBoot.json.households[0];
  const col = await req("POST", "/api/collections", {
    household_id: hh.id, ward_id: hh.ward_id, service_date: "2026-09-23",
    wet_kg: 1.2, dry_kg: 0.4, hazard_kg: 0, segregated: 1, status: "collected",
  }, ft);
  console.log("FIELD_COL", field.json.user.role, col.status, col.json.wet_kg);

  const ih = await req("POST", "/api/ihhl", { household_id: hh.id, ward_id: hh.ward_id, status: "approved" }, ft);
  const ih2 = await req("PATCH", "/api/ihhl/" + ih.json.id, { status: "under_construction" }, ft);
  const hot = await req("POST", "/api/hotspots", { name: "P5 dump", ward_id: hh.ward_id, workflow: "identified" }, ft);
  const hot2 = await req("PATCH", "/api/hotspots/" + hot.json.id, { workflow: "reported" }, ft);
  const gw = await req("POST", "/api/greywater", { ward_id: hh.ward_id, location_name: "nala", action_status: "open" }, ft);
  const gw2 = await req("PATCH", "/api/greywater/" + gw.json.id, { action_status: "in_progress" }, ft);
  const grv = await req("POST", "/api/grievances", { ward_id: hh.ward_id, category: "other", description: "P5", status: "open" }, ft);
  const grv2 = await req("PATCH", "/api/grievances/" + grv.json.id, { status: "in_progress" }, ft);
  console.log("STATUS", ih2.json.status, hot2.json.workflow, gw2.json.action_status, grv2.json.status);

  const notesF = await req("GET", "/api/notifications", null, ft);
  const notesG = await req("GET", "/api/notifications", null, gt);
  const titles = (notesF.json || []).map((n) => n.title);
  const gpTitles = (notesG.json || []).map((n) => n.title);
  console.log("NOTES_F", notesF.status, (notesF.json || []).length, titles.slice(0, 4).join("|"));
  console.log("NOTES_G", notesG.status, (notesG.json || []).length, gpTitles.slice(0, 4).join("|"));

  const admin = await req("POST", "/api/login", { phone: "9000000001", pin: "1234" });
  const at = admin.json.token;
  const dash = await req("GET", "/api/dashboard", null, at);
  const k = dash.json.kpi || {};
  console.log("DASH", dash.status, k.households, k.paying_families, k.paying_shops, k.schools, k.anganwadis, dash.json.census && dash.json.census.population, (dash.json.ihhl || []).length, (dash.json.hotspots || []).length, (dash.json.assets || []).length);

  const csv = await req("GET", "/api/export/households.csv", null, at);
  const xlsx = await req("GET", "/api/export/schools.xlsx", null, at);
  const pdf = await req("GET", "/api/export/ihhl.pdf", null, at);
  const csvBlock = await req("GET", "/api/export/collections.csv?block_id=blk_dhamtari", null, at);
  console.log("EXPORT", csv.status, (csv.type || "").includes("csv"), csv.raw.split("\n").length,
    xlsx.status, (xlsx.type || "").includes("sheet"),
    pdf.status, /<table/.test(pdf.raw),
    csvBlock.status, csvBlock.raw.split("\n").length);

  const audit = await req("GET", "/api/audit-logs", null, at);
  const auditField = await req("GET", "/api/audit-logs", null, ft);
  console.log("AUDIT", audit.status, (audit.json || []).length, auditField.status);

  const sync = await req("POST", "/api/sync", {
    swm_gp: [{ id: "swm_p5_sync", ward_id: wardId, shed_available: 1, dtd_happening: 0, kit_available: 1 }],
    waste_sales: [{ id: "sale_p5_sync", ward_id: wardId, waste_type: "metal", qty_kg: 2, sale_date: "2026-09-22" }],
    pwmu_shipments: [{ id: "pw_p5_sync", ward_id: wardId, qty: 4, unit: "kg", destination: "Jagdalpur" }],
    honorarium: [{ id: "hon_p5_sync", ward_id: wardId, paid: 0, amount_per_person: 200, people: 2, months: 2, total: 99 }],
    waste_category_totals: [{ id: "wct_p5_sync", ward_id: wardId, period: "2026-08", plastic_kg: 5, metal_kg: 1, glass_kg: 0, mixed_kg: 2 }],
    collections: [{ id: "col_p5_sync", household_id: hh.id, ward_id: hh.ward_id, user_id: field.json.user.id, ts: new Date().toISOString(), service_date: "2026-09-22", wet_kg: 0.5, dry_kg: 0.2, segregated: 1, status: "collected" }],
  }, ft);
  const honSync = await req("GET", "/api/honorarium", null, gt);
  const honRow = (honSync.json || []).find((h) => h.id === "hon_p5_sync");
  console.log("SYNC", sync.status, sync.json.ok, sync.json.accepted.swm_gp, sync.json.accepted.honorarium, honRow && honRow.total);

  const fail = [
    gp.json.user.role === "gp",
    swm.status === 200 && Number(swm.json.shed_available) === 1,
    hon.json.total === 6000,
    cat2.json.id === cat.json.id && Number(cat2.json.plastic_kg) === 20,
    sale.status === 200 && pw.status === 200,
    col.status === 200,
    ih2.json.status === "under_construction",
    hot2.json.workflow === "reported",
    gw2.json.action_status === "in_progress",
    (notesF.json || []).length > 0,
    (notesG.json || []).length > 0,
    k.households > 0 && k.schools > 0,
    csv.status === 200 && xlsx.status === 200 && pdf.status === 200,
    audit.status === 200 && auditField.status === 403,
    sync.json.ok,
    honRow && Number(honRow.total) === 800,
  ].some((ok) => !ok);
  if (fail) process.exit(1);
})().catch((e) => { console.error(e); process.exit(1); });
