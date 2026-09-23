const http = require("http");
const PORT = process.env.PORT || 3007;

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
  const d = boot.json;
  const ward = (d.wards || []).find((w) => w.id === (d.user && d.user.ward_id)) || d.wards[0];
  const vil = (d.villages || []).find((v) => v.ward_id === ward.id);
  const inst = (d.households || []).find((h) => h.category === "institution");
  console.log("FIELD", field.status, field.json.user.role, "ward", ward && ward.id, "schools", (d.schools || []).length, "aw", (d.anganwadis || []).length, "bld", (d.buildings || []).length);

  const sch = await req("POST", "/api/schools", {
    name: "P4 बालक विद्यालय", ward_id: ward.id, village_id: vil && vil.id, kind: "boys",
    toilets_total: 6, toilets_functional: 5, toilets_non_functional: 1,
    lat: 20.711, lng: 81.551, photo: "data:image/jpeg;base64,/9j/", notes: "GPS+photo",
  }, ft);
  console.log("SCHOOL", sch.status, sch.json.kind, sch.json.toilets_functional, sch.json.lat);

  const badKind = await req("POST", "/api/schools", {
    name: "bad", ward_id: ward.id, kind: "institution",
  }, ft);
  console.log("SCHOOL_BAD_KIND", badKind.status, badKind.json && badKind.json.error);

  const aw = await req("POST", "/api/anganwadis", {
    name: "P4 आंगनवाड़ी", ward_id: ward.id, village_id: vil && vil.id,
    toilets_total: 2, toilets_functional: 2, toilets_non_functional: 0,
    lat: 20.712, lng: 81.552, photo: "data:image/jpeg;base64,/9j/",
  }, ft);
  console.log("AW", aw.status, aw.json.toilets_total, aw.json.lat);

  const monS = await req("POST", "/api/monitoring-visits", {
    ward_id: ward.id, target_type: "school", target_id: sch.json.id,
    activity: "toilet check", observation: "साबुन उपलब्ध", status: "observed",
    lat: 20.711, lng: 81.551, photo: "data:image/jpeg;base64,/9j/",
  }, ft);
  console.log("MON_SCHOOL", monS.status, monS.json.target_type, monS.json.target_id);

  const monA = await req("POST", "/api/monitoring-visits", {
    ward_id: ward.id, target_type: "anganwadi", target_id: aw.json.id,
    activity: "cleanliness", observation: "आंगन साफ", status: "action_needed",
    lat: 20.712, lng: 81.552,
  }, ft);
  console.log("MON_AW", monA.status, monA.json.status);

  const monBad = await req("POST", "/api/monitoring-visits", {
    ward_id: ward.id, target_type: "institution", target_id: inst ? inst.id : "hh_x",
    activity: "no",
  }, ft);
  console.log("MON_INST", monBad.status, monBad.json && monBad.json.error);

  const monMiss = await req("POST", "/api/monitoring-visits", {
    ward_id: ward.id, target_type: "school", target_id: "no_such_school",
  }, ft);
  console.log("MON_MISS", monMiss.status, monMiss.json && monMiss.json.error);

  const gov = await req("POST", "/api/buildings", {
    name: "P4 पंचायत भवन", ward_id: ward.id, village_id: vil && vil.id, kind: "gov",
    toilets_total: 3, toilets_functional: 2, toilets_non_functional: 1, lat: 20.71, lng: 81.55,
  }, ft);
  const com = await req("POST", "/api/buildings", {
    name: "P4 सामुदायिक भवन", ward_id: ward.id, kind: "community",
    toilets_total: 2, toilets_functional: 2, toilets_non_functional: 0, lat: 20.713, lng: 81.553,
  }, ft);
  console.log("BLD", gov.status, gov.json.kind, com.status, com.json.kind);

  const typed = [];
  const specs = [
    { asset_type: "compost_pit", name: "P4 नाडेप", capacity: "2 pit" },
    { asset_type: "soak_pit", name: "P4 सोकपिट" },
    { asset_type: "community_toilet", name: "P4 CT", toilet_count: 6 },
    { asset_type: "dustbin", name: "P4 डस्टबिन", installed_on: "2026-09-01" },
    { asset_type: "vehicle", name: "P4 रिक्शा", reason: "Ward D2D", capacity: "1 MT" },
    { asset_type: "SLRM", name: "P4 SLRM शेड", capacity: "shed" },
    { asset_type: "MCF", name: "P4 MCF शेड", capacity: "shed" },
  ];
  for (const spec of specs) {
    const a = await req("POST", "/api/assets", { ward_id: ward.id, condition: "functional", ...spec }, ft);
    typed.push(a);
    console.log("AST", spec.asset_type, a.status, a.json.asset_type, a.json.installed_on || a.json.reason || a.json.toilet_count || a.json.capacity || "");
  }

  const sync = await req("POST", "/api/sync", {
    schools: [{ id: "sch_p4_sync", ward_id: ward.id, name: "Sync school", kind: "girls", toilets_total: 2, toilets_functional: 2, toilets_non_functional: 0, lat: 20.7, lng: 81.5 }],
    anganwadis: [{ id: "aw_p4_sync", ward_id: ward.id, name: "Sync AW", toilets_total: 1, toilets_functional: 1, toilets_non_functional: 0 }],
    buildings: [{ id: "bld_p4_sync", ward_id: ward.id, name: "Sync hall", kind: "community", toilets_total: 1, toilets_functional: 1, toilets_non_functional: 0 }],
    assets: [{ id: "ast_p4_sync", ward_id: ward.id, asset_type: "dustbin", name: "Sync bin", installed_on: "2026-08-01" }],
    monitoring_visits: [{ id: "mon_p4_sync", ward_id: ward.id, target_type: "school", target_id: sch.json.id, activity: "sync", status: "observed" }],
  }, ft);
  console.log("SYNC", sync.status, sync.json.ok, sync.json.accepted && sync.json.accepted.schools, sync.json.accepted && sync.json.accepted.monitoring_visits);

  const syncBad = await req("POST", "/api/sync", {
    monitoring_visits: [{ id: "mon_p4_bad", ward_id: ward.id, target_type: "household", target_id: (d.households[0] || {}).id }],
  }, ft);
  console.log("SYNC_BAD", syncBad.json.ok, syncBad.json.errors && syncBad.json.errors[0] && syncBad.json.errors[0].message);

  const hh = d.households[0];
  const soakOnHouse = hh && (hh.soak_pit === 0 || hh.soak_pit === 1);
  console.log("HH_FLAGS", soakOnHouse, "compost", hh && hh.compost_pit);

  const fail = [
    sch.status === 200 && sch.json.kind === "boys" && sch.json.lat,
    badKind.status === 400,
    aw.status === 200 && aw.json.photo,
    monS.status === 200 && monS.json.target_type === "school",
    monA.status === 200 && monA.json.target_type === "anganwadi",
    monBad.status === 400,
    monMiss.status === 400,
    gov.json.kind === "gov" && com.json.kind === "community",
    typed.every((a) => a.status === 200),
    typed[3].json.installed_on === "2026-09-01",
    typed[4].json.reason === "Ward D2D",
    sync.json.ok,
    syncBad.json.ok === false,
    soakOnHouse,
  ].some((ok) => !ok);
  if (fail) process.exit(1);
})().catch((e) => { console.error(e); process.exit(1); });
