const http = require("http");

function req(method, path, body, token) {
  return new Promise((res, rej) => {
    const data = body ? JSON.stringify(body) : null;
    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = "Bearer " + token;
    if (data) headers["Content-Length"] = Buffer.byteLength(data);
    const r = http.request({ hostname: "127.0.0.1", port: process.env.PORT || 3003, path, method, headers }, (rs) => {
      const chunks = [];
      rs.on("data", (c) => chunks.push(c));
      rs.on("end", () => {
        const raw = Buffer.concat(chunks).toString("utf8");
        let json;
        try { json = JSON.parse(raw); } catch (_) { /* not json */ }
        res({ status: rs.statusCode, json, raw, ctype: rs.headers["content-type"] });
      });
    });
    r.on("error", rej);
    if (data) r.write(data);
    r.end();
  });
}

(async () => {
  const html = await req("GET", "/");
  console.log("HTML", html.status, html.raw.includes('id="app"'), html.raw.includes("screens/login.js"));
  const store = await req("GET", "/js/store.js");
  console.log("STORE", store.status, store.raw.includes("SD.screens = SD.screens"));
  const sw = await req("GET", "/sw.js");
  console.log("SW", sw.status, sw.raw.includes("sd-v2.0.2"));

  const field = await req("POST", "/api/login", { phone: "9000000101", pin: "1234" });
  if (!field.json || !field.json.token) throw new Error("field login failed " + field.raw);
  console.log("FIELD_LOGIN", field.status, field.json.user.role);
  const ft = field.json.token;

  const boot = await req("GET", "/api/bootstrap", null, ft);
  const d = boot.json;
  console.log("BOOT", { hh: d.households.length, wards: d.wards.length, collections: d.collections.length, payments: d.payments.length });
  const hh = d.households[0];
  const today = new Date().toISOString();

  const col = await req("POST", "/api/collections", {
    id: "col_p1_test", household_id: hh.id, ward_id: hh.ward_id, user_id: field.json.user.id,
    ts: today, service_date: today.slice(0, 10), wet_kg: 1.2, dry_kg: 0.4, hazard_kg: 0, segregated: 1, status: "collected",
  }, ft);
  console.log("COLLECT", col.status, col.json && col.json.status, col.json && col.json.wet_kg);

  const pay = await req("POST", "/api/payments", {
    id: "pay_p1_test", household_id: hh.id, ward_id: hh.ward_id, user_id: field.json.user.id,
    amount: 30, period: "2026-09", mode: "cash", receipt_no: "RCPTEST01", ts: today,
  }, ft);
  console.log("FEE", pay.status, pay.json && pay.json.receipt_no, pay.json && pay.json.amount);

  const grv = await req("POST", "/api/grievances", {
    id: "grv_p1_test", household_id: hh.id, ward_id: hh.ward_id, category: "missed_collection",
    description: "P1 smoke", status: "open", raised_by: field.json.user.id,
    raised_by_name: field.json.user.name, ts: today,
  }, ft);
  console.log("GRV", grv.status, grv.json && grv.json.category, grv.json && grv.json.status);

  const admin = await req("POST", "/api/login", { phone: "9000000001", pin: "1234" });
  console.log("ADMIN_LOGIN", admin.status, admin.json.user.role);
  const at = admin.json.token;
  const dash = await req("GET", "/api/dashboard", null, at);
  console.log("DASH", dash.status, dash.json.kpi && dash.json.kpi.households, dash.json.kpi && dash.json.kpi.fees_collected);

  const csv = await req("GET", "/api/export/collections.csv?token=" + at);
  console.log("CSV", csv.status, (csv.ctype || "").slice(0, 24));
  const xlsx = await req("GET", "/api/export/payments.xlsx?token=" + at);
  console.log("XLSX", xlsx.status, (xlsx.ctype || "").slice(0, 40));

  const sync = await req("POST", "/api/sync", {
    collections: [{
      id: "col_p1_sync", household_id: hh.id, ward_id: hh.ward_id, user_id: field.json.user.id,
      ts: today, service_date: today.slice(0, 10), wet_kg: 0.8, dry_kg: 0.2, hazard_kg: 0, segregated: 1, status: "collected",
    }],
    payments: [{
      id: "pay_p1_sync", household_id: hh.id, ward_id: hh.ward_id, user_id: field.json.user.id,
      amount: 30, period: "2026-09", mode: "cash", receipt_no: "RCPSYNC01", ts: today,
    }],
  }, ft);
  console.log("SYNC", sync.status, sync.json.ok, sync.json.accepted.collections, sync.json.accepted.payments, sync.json.errors);

  const qr = await req("GET", "/api/households/by-code/" + encodeURIComponent(hh.code), null, ft);
  console.log("QR_LOOKUP", qr.status, qr.json && qr.json.code);

  const failed = [
    html.status === 200, store.status === 200, sw.status === 200,
    field.status === 200, col.status === 200, pay.status === 200, grv.status === 200,
    dash.status === 200, csv.status === 200, xlsx.status === 200, sync.json.ok, qr.status === 200,
  ].some((ok) => !ok);
  if (failed) process.exit(1);
})().catch((e) => { console.error(e); process.exit(1); });
