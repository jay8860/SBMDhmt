const { uid, int, nowISO } = require("../lib/ids");
const { requireRole } = require("../auth/middleware");
const { audit } = require("../lib/audit");

module.exports = function geographyRoutes(db, { auth }) {
  const r = require("express").Router();

  r.get("/states", auth, async (_req, res) => res.json(await db.all("SELECT * FROM states ORDER BY name_en")));
  r.get("/districts", auth, async (req, res) => {
    let sql = "SELECT * FROM districts WHERE 1=1";
    const p = [];
    if (req.query.state_id) { sql += " AND state_id = ?"; p.push(req.query.state_id); }
    res.json(await db.all(sql + " ORDER BY name_en", p));
  });

  r.post("/states", auth, requireRole("state_admin"), async (req, res) => {
    const b = req.body || {};
    const id = b.id || uid("st_");
    await db.upsert("states", { id, name_hi: b.name_hi, name_en: b.name_en || b.name_hi, code: b.code || null }, "id");
    await audit(db, req.user.id, "upsert", "states", id);
    res.json(await db.get("SELECT * FROM states WHERE id = ?", [id]));
  });

  r.post("/districts", auth, requireRole("state_admin"), async (req, res) => {
    const b = req.body || {};
    const id = b.id || uid("dst_");
    await db.upsert("districts", { id, state_id: b.state_id, name_hi: b.name_hi, name_en: b.name_en || b.name_hi, code: b.code || null }, "id");
    await audit(db, req.user.id, "upsert", "districts", id);
    res.json(await db.get("SELECT * FROM districts WHERE id = ?", [id]));
  });

  r.post("/blocks", auth, requireRole("admin", "state_admin"), async (req, res) => {
    const b = req.body || {};
    const id = b.id || uid("blk_");
    await db.upsert("blocks", {
      id, name_hi: b.name_hi, name_en: b.name_en, kind: b.kind || "rural",
      code: b.code || null, district_id: b.district_id || req.user.district_id || null,
    }, "id");
    await audit(db, req.user.id, "upsert", "blocks", id);
    res.json(await db.get("SELECT * FROM blocks WHERE id = ?", [id]));
  });

  r.post("/wards", auth, requireRole("admin", "supervisor", "state_admin"), async (req, res) => {
    const b = req.body || {};
    if (!b.block_id || !b.name_hi) return res.status(400).json({ error: "block_and_name_required" });
    const id = b.id || uid("wrd_");
    const kind = b.kind || "gp";
    await db.upsert("wards", {
      id, block_id: b.block_id, name_hi: b.name_hi, name_en: b.name_en || b.name_hi,
      kind, code: b.code || null, target_households: int(b.target_households),
    }, "id");
    if (kind === "gp") {
      const ts = nowISO();
      const profile = await db.get("SELECT id FROM gp_profiles WHERE ward_id = ?", [id]);
      if (!profile) {
        await db.upsert("gp_profiles", {
          id: `gpp_${id}`, ward_id: id, sarpanch_name: null, sarpanch_mobile: null,
          secretary_name: null, secretary_mobile: null, updated_at: ts,
        }, "id");
      }
      const village = await db.get("SELECT id FROM villages WHERE ward_id = ?", [id]);
      if (!village) {
        const hi = (b.name_hi || "").replace(/^ग्राम पंचायत\s+/, "");
        await db.upsert("villages", {
          id: `vil_${id}`, ward_id: id, name_hi: hi || b.name_hi, name_en: b.name_en || hi || b.name_hi,
          code: b.code || null, fam_st: 0, fam_sc: 0, fam_obc: 0, fam_gen: 0, fam_total: 0,
          pop_st: 0, pop_sc: 0, pop_obc: 0, pop_gen: 0, pop_total: 0, updated_at: ts,
        }, "id");
      }
    }
    await audit(db, req.user.id, "upsert", "wards", id);
    res.json(await db.get("SELECT * FROM wards WHERE id = ?", [id]));
  });

  return r;
};
