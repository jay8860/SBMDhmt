const { BLOCKS, STATE, DISTRICTS, buildWards, ri } = require("./geography");
const { staffUsers, DIDI_NAMES, SHG } = require("./users");
const { seedDemo, FIRST, LAST, rnd } = require("./demo");

async function backfillMasters(db, { hashPin, uid, nowISO }) {
  await db.upsert("states", STATE, "id");
  for (const d of DISTRICTS) await db.upsert("districts", d, "id");
  const blocks = await db.all("SELECT * FROM blocks");
  for (const b of blocks) {
    if (!b.district_id) await db.run("UPDATE blocks SET district_id = ? WHERE id = ?", ["dst_dhamtari", b.id]);
  }
  const gps = await db.all("SELECT * FROM wards WHERE kind = 'gp'");
  for (const w of gps) {
    const existing = await db.get("SELECT id FROM gp_profiles WHERE ward_id = ?", [w.id]);
    if (!existing) {
      await db.upsert("gp_profiles", {
        id: `gpp_${w.id}`, ward_id: w.id,
        sarpanch_name: null, sarpanch_mobile: null,
        secretary_name: null, secretary_mobile: null, updated_at: nowISO(),
      }, "id");
    }
    const v = await db.get("SELECT id FROM villages WHERE ward_id = ?", [w.id]);
    if (!v) {
      const hi = (w.name_hi || "").replace(/^ग्राम पंचायत\s+/, "");
      const en = (w.name_en || "").replace(/^GP\s+/, "");
      await db.upsert("villages", {
        id: `vil_${w.id}`, ward_id: w.id, name_hi: hi || w.name_hi, name_en: en || w.name_en,
        code: w.code, fam_st: 0, fam_sc: 0, fam_obc: 0, fam_gen: 0, fam_total: 0,
        pop_st: 0, pop_sc: 0, pop_obc: 0, pop_gen: 0, pop_total: 0, updated_at: nowISO(),
      }, "id");
    }
  }
  try {
    await db.run("UPDATE users SET role = 'swachhagrahi' WHERE role = 'didi'");
  } catch (_) { /* alias still accepted at login */ }
  const dumps = await db.all("SELECT * FROM grievances WHERE category = 'garbage_dump'");
  for (const g of dumps) {
    const hid = `hot_grv_${g.id}`;
    const exists = await db.get("SELECT id FROM hotspots WHERE id = ?", [hid]);
    if (!exists) {
      await db.upsert("hotspots", {
        id: hid, ward_id: g.ward_id, name: g.description || "Garbage dump",
        lat: g.lat, lng: g.lng, photo: g.photo, cleanliness_status: g.status === "resolved" ? "clean" : "dirty",
        workflow: g.status === "resolved" ? "verified" : "identified",
        notes: g.description, raised_by: g.raised_by, ts: g.ts, updated_at: nowISO(),
      }, "id");
    }
  }
  const admin = await db.get("SELECT id FROM users WHERE id = 'usr_admin'");
  if (admin) await db.run("UPDATE users SET district_id = ? WHERE id = 'usr_admin' AND (district_id IS NULL OR district_id = '')", ["dst_dhamtari"]);
  await backfillFacilities(db, { nowISO });
  const state = await db.get("SELECT id FROM users WHERE id = 'usr_state'");
  if (!state) {
    await db.upsert("users", {
      id: "usr_state", name: "राज्य प्रशासक (SBM)", phone: "9000000000",
      pin: hashPin("1234"), role: "state_admin", block_id: null, ward_id: null,
      shg_name: null, active: 1, created_at: nowISO(), aadhaar: null, district_id: null,
    }, "id");
  }
  const gpUser = await db.get("SELECT id FROM users WHERE id = 'usr_gp_1'");
  if (!gpUser) {
    await db.upsert("users", {
      id: "usr_gp_1", name: "ग्राम पंचायत सचिव — अर्जुनी", phone: "9000000201",
      pin: hashPin("1234"), role: "gp", block_id: "blk_dhamtari", ward_id: "wrd_dhm_1",
      shg_name: null, active: 1, created_at: nowISO(), aadhaar: null, district_id: "dst_dhamtari",
    }, "id");
  }
}

async function backfillFacilities(db, { nowISO }) {
  const allGps = await db.all("SELECT * FROM wards WHERE kind = 'gp'");
  const prefer = new Set(["wrd_dhm_1", "wrd_dhm_2", "wrd_kur_1", "wrd_udm_1", "wrd_udm_2", "wrd_nag_1"]);
  const wards = allGps.filter((w) => prefer.has(w.id));
  const list = wards.length ? wards : allGps.slice(0, 6);
  for (const w of list) {
    const vil = await db.get("SELECT * FROM villages WHERE ward_id = ? ORDER BY rowid", [w.id]);
    const hi = (w.name_hi || "").replace(/^ग्राम पंचायत\s+/, "") || w.name_hi;
    const lat = 20.71 + (String(w.id).length % 7) * 0.01;
    const lng = 81.54 + (String(w.id).length % 5) * 0.01;
    const sid = `sch_${w.id}`;
    if (!(await db.get("SELECT id FROM schools WHERE id = ?", [sid]))) {
      await db.upsert("schools", {
        id: sid, ward_id: w.id, village_id: vil && vil.id,
        name: `शासकीय प्राथमिक विद्यालय — ${hi}`,
        kind: w.id.endsWith("2") ? "girls" : "coed",
        toilets_total: 4, toilets_functional: 3, toilets_non_functional: 1,
        lat, lng, photo: null, notes: null, updated_at: nowISO(),
      }, "id");
    }
    const aid = `aw_${w.id}`;
    if (!(await db.get("SELECT id FROM anganwadis WHERE id = ?", [aid]))) {
      await db.upsert("anganwadis", {
        id: aid, ward_id: w.id, village_id: vil && vil.id,
        name: `आंगनवाड़ी केंद्र — ${hi}`,
        toilets_total: 2, toilets_functional: 2, toilets_non_functional: 0,
        lat: lat + 0.002, lng: lng + 0.002, photo: null, notes: null, updated_at: nowISO(),
      }, "id");
    }
    const bgid = `bld_gov_${w.id}`;
    if (!(await db.get("SELECT id FROM buildings WHERE id = ?", [bgid]))) {
      await db.upsert("buildings", {
        id: bgid, ward_id: w.id, village_id: vil && vil.id, kind: "gov",
        name: `पंचायत भवन — ${hi}`,
        toilets_total: 2, toilets_functional: 2, toilets_non_functional: 0,
        lat: lat + 0.001, lng: lng - 0.001, photo: null, notes: null, updated_at: nowISO(),
      }, "id");
    }
    const bcid = `bld_com_${w.id}`;
    if (!(await db.get("SELECT id FROM buildings WHERE id = ?", [bcid]))) {
      await db.upsert("buildings", {
        id: bcid, ward_id: w.id, village_id: vil && vil.id, kind: "community",
        name: `सामुदायिक भवन — ${hi}`,
        toilets_total: 1, toilets_functional: 1, toilets_non_functional: 0,
        lat: lat - 0.001, lng: lng + 0.001, photo: null, notes: null, updated_at: nowISO(),
      }, "id");
    }
    const typed = [
      ["compost_pit", "नाडेप", { capacity: "2 pit" }],
      ["soak_pit", "सोकपिट", {}],
      ["community_toilet", "सामुदायिक शौचालय", { toilet_count: 4 }],
      ["dustbin", "सामुदायिक डस्टबिन", { installed_on: "2026-04-01" }],
      ["vehicle", "कचरा वाहन", { reason: "D2D", capacity: "1 MT" }],
      ["SLRM", "SLRM शेड", { capacity: "shed" }],
      ["MCF", "MCF शेड", { capacity: "shed" }],
    ];
    for (const [typ, label, extra] of typed) {
      const astId = `ast_${typ}_${w.id}`;
      if (!(await db.get("SELECT id FROM assets WHERE id = ?", [astId]))) {
        await db.upsert("assets", {
          id: astId, asset_type: typ, name: `${label} — ${hi}`,
          ward_id: w.id, block_id: w.block_id, condition: "functional",
          capacity: extra.capacity || null, ownership: "panchayat",
          lat, lng, photo: null, notes: null, surveyed_by: "usr_admin",
          ts: nowISO(), created_at: nowISO(),
          toilet_count: extra.toilet_count || null,
          reason: extra.reason || null,
          installed_on: extra.installed_on || null,
        }, "id");
      }
    }
  }
}

async function seed(db, { hashPin, uid, nowISO }) {
  await backfillMasters(db, { hashPin, uid, nowISO });
  const existing = await db.get("SELECT COUNT(*) AS n FROM blocks");
  if (Number(existing.n) > 0) {
    console.log("Master data already present; new geography/profile tables backfilled.");
    return;
  }
  console.log("Seeding Dhamtari master data…");
  for (const b of BLOCKS) await db.upsert("blocks", b, "id");
  const wards = buildWards();
  for (const w of wards) await db.upsert("wards", w, "id");
  const pilotWards = [
    wards.find((w) => w.id === "wrd_dhm_1"),
    wards.find((w) => w.id === "wrd_dhm_2"),
    wards.find((w) => w.id === "wrd_kur_1"),
    wards.find((w) => w.id === "wrd_udm_1"),
    wards.find((w) => w.id === "wrd_udm_2"),
    wards.find((w) => w.id === "wrd_nag_1"),
  ].filter(Boolean);

  const users = staffUsers();
  pilotWards.forEach((w, i) => {
    users.push({
      id: `usr_didi_${i + 1}`, name: DIDI_NAMES[i % DIDI_NAMES.length],
      phone: `900000010${i + 1}`, role: "swachhagrahi",
      block_id: w.block_id, ward_id: w.id, shg_name: SHG[i % SHG.length],
      pin: "1234", district_id: "dst_dhamtari",
    });
  });
  for (const u of users) {
    await db.upsert("users", {
      id: u.id, name: u.name, phone: u.phone, pin: hashPin(u.pin), role: u.role,
      block_id: u.block_id || null, ward_id: u.ward_id || null, shg_name: u.shg_name || null,
      active: 1, created_at: nowISO(), aadhaar: null, district_id: u.district_id || null,
    }, "id");
  }
  await backfillMasters(db, { hashPin, uid, nowISO });
  if (process.env.SEED_DEMO === "off") {
    console.log("Master data seeded (demo data skipped).");
    return;
  }
  const CATS = Array(16).fill("household").concat(["shop", "shop", "hotel", "institution", "clinic"]);
  const FEE = { household: 30, shop: 100, hotel: 300, institution: 200, clinic: 250 };
  const households = [];
  for (const w of pilotWards) {
    const n = ri(28, 45);
    for (let i = 1; i <= n; i++) {
      const cat = rnd(CATS);
      households.push({
        id: uid("hh_"), code: `DHM-${w.code}-${String(i).padStart(4, "0")}`,
        head_name: `${rnd(FIRST)} ${rnd(LAST)}`, phone: `9${ri(700000000, 999999999)}`,
        ward_id: w.id, house_no: `${ri(1, 250)}`, category: cat, fee_slab: FEE[cat],
        family_size: ri(2, 8), lat: 20.7 + Math.random() * 0.35, lng: 81.5 + Math.random() * 0.4,
        toilet: Math.random() > 0.05 ? 1 : 0, soak_pit: Math.random() > 0.5 ? 1 : 0,
        compost_pit: Math.random() > 0.65 ? 1 : 0, active: 1, created_by: "usr_admin",
        created_at: nowISO(), updated_at: nowISO(),
      });
    }
  }
  for (const h of households) await db.upsert("households", h, "id");
  const didis = users.filter((u) => u.role === "swachhagrahi" || u.role === "didi");
  await seedDemo(db, { uid, nowISO, households, didis, wards });
  console.log(`Seeded: ${BLOCKS.length} blocks, ${wards.length} wards, ${households.length} households, demo activity.`);
}

module.exports = { seed };
