const { ri } = require("./geography");

const FIRST = ["सुनीता", "रामकुमार", "गीता", "दुर्गा", "भोजराम", "लक्ष्मी", "तिजऊ", "संतोषी", "हेमलाल", "फूलबाई", "चंद्रिका", "यशोदा", "देवकी", "मनहरण", "कौशल्या", "ईश्वर", "सरिता", "पुनीत", "अनिता", "दिलीप", "रेखा", "घनश्याम", "ममता", "तुलसी", "नरेश", "शकुंतला", "बलराम", "सावित्री", "जगदीश", "पार्वती"];
const LAST = ["साहू", "यादव", "निषाद", "ध्रुव", "नेताम", "मरकाम", "सिन्हा", "देवांगन", "वर्मा", "कोर्राम", "ठाकुर", "बघेल"];

const rnd = (a) => a[Math.floor(Math.random() * a.length)];

async function seedDemo(db, { uid, nowISO, households, didis, wards }) {
  const days = 21;
  for (let d = days - 1; d >= 0; d--) {
    const date = new Date(Date.now() - d * 864e5);
    const ds = date.toISOString().slice(0, 10);
    if (date.getDay() === 0) continue;
    for (const didi of didis) {
      const mine = households.filter((h) => h.ward_id === didi.ward_id);
      const rate = 0.62 + Math.random() * 0.33;
      if (d > 0) {
        await db.upsert("attendance", {
          id: uid("att_"), user_id: didi.id, ward_id: didi.ward_id, service_date: ds,
          in_ts: `${ds}T07:${String(ri(0, 45)).padStart(2, "0")}:00Z`,
          out_ts: `${ds}T12:${String(ri(0, 55)).padStart(2, "0")}:00Z`,
          lat: 20.71, lng: 81.55, created_at: nowISO(),
        }, "id");
      }
      for (const h of mine) {
        if (Math.random() > rate) continue;
        await db.upsert("collections", {
          id: uid("col_"), household_id: h.id, ward_id: h.ward_id, user_id: didi.id,
          ts: `${ds}T0${ri(7, 9)}:${String(ri(0, 59)).padStart(2, "0")}:00Z`, service_date: ds,
          wet_kg: Math.round((0.4 + Math.random() * 2.2) * 10) / 10,
          dry_kg: Math.round((0.2 + Math.random() * 1.1) * 10) / 10,
          hazard_kg: Math.random() > 0.9 ? 0.1 : 0,
          segregated: Math.random() > 0.24 ? 1 : 0, status: "collected",
          lat: h.lat, lng: h.lng, photo: null, notes: null, created_at: nowISO(),
        }, "id");
      }
      for (const h of mine) {
        if (Math.random() > 0.06) continue;
        await db.upsert("payments", {
          id: uid("pay_"), household_id: h.id, ward_id: h.ward_id, user_id: didi.id,
          amount: h.fee_slab, period: ds.slice(0, 7), mode: Math.random() > 0.25 ? "cash" : "upi",
          receipt_no: `RCP${Date.now().toString().slice(-6)}${ri(100, 999)}`,
          ts: `${ds}T1${ri(0, 1)}:${String(ri(0, 59)).padStart(2, "0")}:00Z`,
          lat: h.lat, lng: h.lng, notes: null, created_at: nowISO(),
        }, "id");
      }
    }
  }
  const gcats = ["missed_collection", "irregular_timing", "no_segregation_bin", "drain_blockage", "garbage_dump", "toilet_issue", "vehicle_issue", "other"];
  for (let i = 0; i < 22; i++) {
    const h = rnd(households);
    const st = rnd(["open", "open", "in_progress", "resolved", "resolved"]);
    const ts = new Date(Date.now() - ri(0, 25) * 864e5).toISOString();
    await db.upsert("grievances", {
      id: uid("grv_"), household_id: h.id, ward_id: h.ward_id, block_id: null,
      category: rnd(gcats), description: "नागरिक द्वारा दर्ज शिकायत — मौके पर सत्यापन आवश्यक।",
      status: st, priority: rnd(["normal", "normal", "high"]),
      raised_by: "usr_admin", raised_by_name: h.head_name, ts, lat: h.lat, lng: h.lng,
      photo: null, assigned_to: null,
      resolution: st === "resolved" ? "निराकरण किया गया, नागरिक संतुष्ट।" : null,
      resolved_ts: st === "resolved" ? new Date().toISOString() : null, created_at: nowISO(),
    }, "id");
  }
  const atypes = [
    ["SLRM", "ठोस तरल अपशिष्ट प्रबंधन केंद्र"], ["MCF", "सामग्री संग्रहरण केंद्र"],
    ["RRF", "रिसोर्स रिकवरी सेंटर"], ["vehicle", "रिक्शा/टिपर"],
    ["soak_pit", "सोकपिट"], ["compost_pit", "नाडेप कम्पोस्ट"],
    ["community_toilet", "सामुदायिक शौचालय"], ["dustbin", "सामुदायिक डस्टबिन"],
  ];
  for (const w of wards.slice(0, 28)) {
    const [t, label] = rnd(atypes);
    await db.upsert("assets", {
      id: uid("ast_"), asset_type: t, name: `${label} — ${w.name_hi}`,
      ward_id: w.id, block_id: w.block_id,
      condition: rnd(["functional", "functional", "functional", "needs_repair", "non_functional"]),
      capacity: t === "vehicle" ? `${ri(1, 3)} MT` : `${ri(50, 500)} kg/day`,
      ownership: rnd(["panchayat", "ulb", "shg"]),
      lat: 20.7 + Math.random() * 0.35, lng: 81.5 + Math.random() * 0.4,
      photo: null, notes: null, surveyed_by: "usr_admin", ts: nowISO(), created_at: nowISO(),
      toilet_count: t === "community_toilet" ? ri(2, 8) : null,
      reason: null, installed_on: null,
    }, "id");
  }
}

module.exports = { seedDemo, FIRST, LAST, rnd };
