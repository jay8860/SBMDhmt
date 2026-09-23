const http = require("http");
const PORT = process.env.PORT || 3004;

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
  const state = await req("POST", "/api/login", { phone: "9000000000", pin: "1234" });
  console.log("STATE", state.status, state.json && state.json.user && state.json.user.role);
  const admin = await req("POST", "/api/login", { phone: "9000000001", pin: "1234" });
  console.log("ADMIN", admin.status, admin.json.user.role, admin.json.user.district_id);
  const gp = await req("POST", "/api/login", { phone: "9000000201", pin: "1234" });
  console.log("GP", gp.status, gp.json.user.role, gp.json.user.ward_id);
  const field = await req("POST", "/api/login", { phone: "9000000101", pin: "1234" });
  console.log("FIELD", field.status, field.json.user.role);

  const at = admin.json.token, gt = gp.json.token, ft = field.json.token, st = state.json.token;

  const blk = await req("POST", "/api/blocks", { name_hi: "टेस्ट जनपद", name_en: "Test Janpad", code: "TST", district_id: "dst_dhamtari" }, at);
  console.log("BLOCK", blk.status, blk.json && blk.json.id);

  const ward = await req("POST", "/api/wards", {
    name_hi: "ग्राम पंचायत टेस्टगाँव", name_en: "GP Testgaon", block_id: blk.json.id, kind: "gp", code: "TST01",
  }, at);
  console.log("WARD", ward.status, ward.json && ward.json.id);

  const prof = await req("GET", "/api/gp/" + ward.json.id + "/profile", null, at);
  console.log("PROFILE_SEED", prof.status, !!prof.json.profile, prof.json.ward && prof.json.ward.name_hi);

  const putp = await req("PUT", "/api/gp/wrd_dhm_1/profile", {
    sarpanch_name: "राम यादव", sarpanch_mobile: "9876500001", secretary_name: "सीता साहू", secretary_mobile: "9876500002",
  }, gt);
  console.log("GP_PUT", putp.status, putp.json && putp.json.sarpanch_name);

  const steal = await req("PUT", "/api/gp/wrd_kur_1/profile", { sarpanch_name: "Nope" }, gt);
  console.log("GP_STEAL", steal.status, steal.json && steal.json.error);

  const vOk = await req("POST", "/api/villages", {
    ward_id: "wrd_dhm_1", name_hi: "अर्जुनी टोला", fam_st: 4, fam_sc: 3, fam_obc: 8, fam_gen: 2,
    pop_st: 16, pop_sc: 12, pop_obc: 30, pop_gen: 9,
  }, gt);
  console.log("VILLAGE", vOk.status, vOk.json && vOk.json.fam_total, vOk.json && vOk.json.pop_total);

  const vSteal = await req("POST", "/api/villages", { ward_id: "wrd_kur_1", name_hi: "बाहर" }, gt);
  console.log("VILLAGE_STEAL", vSteal.status, vSteal.json && vSteal.json.error);

  const gVillages = await req("GET", "/api/villages", null, gt);
  const allOutside = (gVillages.json || []).some((v) => v.ward_id !== "wrd_dhm_1");
  console.log("GP_VILLAGES", gVillages.status, (gVillages.json || []).length, "outside=", allOutside);

  const asg = await req("POST", "/api/users", {
    name: "टेस्ट स्वच्छाग्राही", phone: "9000000999", role: "didi", pin: "1234",
    block_id: "blk_dhamtari", ward_id: "wrd_dhm_1", aadhaar: "123412341234",
    assignments: [{ village_id: vOk.json.id, ward_id: "wrd_dhm_1" }],
  }, at);
  console.log("USER_DIDI", asg.status, asg.json && asg.json.role, (asg.json && asg.json.assignments || []).length);

  const alias = await req("POST", "/api/login", { phone: "9000000999", pin: "1234" });
  console.log("ALIAS_LOGIN", alias.status, alias.json.user && alias.json.user.role, (alias.json.assignments || []).length);

  const users = await req("GET", "/api/users", null, gt);
  console.log("GP_USERS", users.status, Array.isArray(users.json) && users.json.every((u) => !u.ward_id || u.ward_id === "wrd_dhm_1"));

  const col = await req("POST", "/api/collections", {
    id: "col_p2", household_id: (await req("GET", "/api/bootstrap", null, ft)).json.households[0].id,
    ward_id: "wrd_dhm_1", user_id: field.json.user.id, ts: new Date().toISOString(),
    service_date: new Date().toISOString().slice(0, 10), wet_kg: 1, dry_kg: 0.2, status: "collected",
  }, ft);
  console.log("COLLECT_STILL", col.status, col.json && col.json.status);

  const fail = [
    state.json.user.role === "state_admin",
    admin.json.user.role === "admin",
    gp.json.user.role === "gp",
    field.json.user.role === "swachhagrahi",
    blk.status === 200, ward.status === 200, prof.json.profile,
    putp.status === 200, steal.status === 403,
    vOk.json.fam_total === 17, vOk.json.pop_total === 67,
    vSteal.status === 403, !allOutside,
    asg.json.role === "swachhagrahi", alias.json.user.role === "swachhagrahi",
    col.status === 200,
  ].some((ok) => !ok);
  if (fail) process.exit(1);
})().catch((e) => { console.error(e); process.exit(1); });
