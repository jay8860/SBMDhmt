const http = require("http");
const PORT = process.env.PORT || 3005;

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
        try { json = JSON.parse(raw); } catch (_) { /* ignore */ }
        res({ status: rs.statusCode, json, raw });
      });
    });
    r.on("error", rej);
    if (data) r.write(data);
    r.end();
  });
}

(async () => {
  const field = await req("POST", "/api/login", { phone: "9000000101", pin: "1234" });
  const ft = field.json.token;
  const boot = await req("GET", "/api/bootstrap", null, ft);
  const hh = boot.json.households[0];
  console.log("FIELD", field.status, field.json.user.role, "hh", hh && hh.code);

  const ih = await req("POST", "/api/ihhl", {
    household_id: hh.id, ward_id: hh.ward_id, status: "approved",
    incentive_amount: 12000, incentive_status: "pending",
  }, ft);
  console.log("IHHL", ih.status, ih.json.status, ih.json.id);
  const fwd = await req("PATCH", "/api/ihhl/" + ih.json.id, { status: "under_construction" }, ft);
  console.log("IHHL_FWD", fwd.status, fwd.json.status);
  const geo = await req("PATCH", "/api/ihhl/" + ih.json.id, { status: "geotagged", lat: 20.71, lng: 81.55, photo: "data:image/jpeg;base64,/9j/" }, ft);
  console.log("IHHL_GEO", geo.status, geo.json.status, geo.json.lat);
  const back = await req("PATCH", "/api/ihhl/" + ih.json.id, { status: "approved" }, ft);
  console.log("IHHL_BACK", back.status, back.json && back.json.error);
  const paid = await req("PATCH", "/api/ihhl/" + ih.json.id, { status: "incentive_paid", incentive_status: "paid", incentive_date: "2026-09-23" }, ft);
  console.log("IHHL_PAID", paid.status, paid.json.status, paid.json.incentive_date);

  const hot = await req("POST", "/api/hotspots", {
    name: "नाला डंप", ward_id: hh.ward_id, workflow: "identified", lat: 20.705, lng: 81.548, cleanliness_status: "dirty",
  }, ft);
  console.log("HOT", hot.status, hot.json.workflow, hot.json.id);
  const hfwd = await req("PATCH", "/api/hotspots/" + hot.json.id, { workflow: "reported" }, ft);
  console.log("HOT_FWD", hfwd.status, hfwd.json.workflow);
  const hback = await req("PATCH", "/api/hotspots/" + hot.json.id, { workflow: "identified" }, ft);
  console.log("HOT_BACK", hback.status, hback.json && hback.json.error);

  const dumpGrv = await req("POST", "/api/grievances", {
    household_id: hh.id, ward_id: hh.ward_id, category: "garbage_dump",
    description: "बाजार के पीछे कचरा", status: "open",
  }, ft);
  const dumpHot = await req("GET", "/api/hotspots", null, ft);
  const linked = (dumpHot.json || []).some((h) => h.id === "hot_grv_" + dumpGrv.json.id);
  console.log("DUMP_LINK", dumpGrv.status, linked);

  const cl = await req("POST", "/api/cleanliness-cases", {
    ward_id: hh.ward_id, hotspot_id: hot.json.id, location_name: "नाला किनारा",
    garbage_qty_kg: 12.5, before_photo: "data:image/jpeg;base64,before", lat: 20.705, lng: 81.548,
  }, ft);
  console.log("CLEAN_BEFORE", cl.status, cl.json.status, !!cl.json.before_photo);
  const cl2 = await req("PATCH", "/api/cleanliness-cases/" + cl.json.id, { after_photo: "data:image/jpeg;base64,after" }, ft);
  console.log("CLEAN_AFTER", cl2.status, cl2.json.status, !!cl2.json.after_photo);

  const soak = await req("POST", "/api/assets", {
    asset_type: "soak_pit", name: "अर्जुनी सोकपिट", ward_id: hh.ward_id, condition: "functional",
  }, ft);
  console.log("SOAK", soak.status, soak.json.id);
  const gw = await req("POST", "/api/greywater", {
    ward_id: hh.ward_id, accumulates: 1, location_name: "पश्चिमी नाला",
    problem: "पानी जमा", proposed_action: "सोकपिट", action_status: "open",
    janpad_submitted_on: "2026-09-20", soak_pit_asset_id: soak.json.id, lat: 20.7, lng: 81.54,
  }, ft);
  console.log("GREY", gw.status, gw.json.soak_pit_asset_id, gw.json.janpad_submitted_on);

  const sync = await req("POST", "/api/sync", {
    ihhl: [{ id: "ihh_p3_sync", household_id: hh.id, ward_id: hh.ward_id, status: "approved" }],
    hotspots: [{ id: "hot_p3_sync", ward_id: hh.ward_id, name: "Sync dump", workflow: "identified", lat: 20.7, lng: 81.5 }],
    cleanliness_cases: [{ id: "cln_p3_sync", ward_id: hh.ward_id, location_name: "Sync case", before_photo: "x" }],
    greywater_cases: [{ id: "gw_p3_sync", ward_id: hh.ward_id, location_name: "Sync nala", accumulates: 1 }],
  }, ft);
  console.log("SYNC", sync.status, sync.json.ok, sync.json.accepted.ihhl, sync.json.accepted.hotspots, sync.json.accepted.cleanliness_cases, sync.json.accepted.greywater_cases);

  const syncBack = await req("POST", "/api/sync", {
    ihhl: [{ id: ih.json.id, household_id: hh.id, ward_id: hh.ward_id, status: "approved" }],
  }, ft);
  console.log("SYNC_BACK", syncBack.json.ok, syncBack.json.errors && syncBack.json.errors[0] && syncBack.json.errors[0].message);

  const notes = await req("GET", "/api/notifications", null, ft);
  console.log("NOTES", notes.status, (notes.json || []).length);

  const fail = [
    ih.status === 200, fwd.json.status === "under_construction", geo.json.status === "geotagged",
    back.status === 400, paid.json.status === "incentive_paid",
    hot.status === 200, hfwd.json.workflow === "reported", hback.status === 400,
    cl2.json.status === "cleaned", linked, gw.json.soak_pit_asset_id === soak.json.id,
    sync.json.ok, syncBack.json.ok === false,
  ].some((ok) => !ok);
  if (fail) process.exit(1);
})().catch((e) => { console.error(e); process.exit(1); });
