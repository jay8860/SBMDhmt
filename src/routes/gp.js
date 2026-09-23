const { nowISO } = require("../lib/ids");
const { audit } = require("../lib/audit");
const { scopeFor } = require("../auth/scope");

module.exports = function gpRoutes(db, { auth }) {
  const r = require("express").Router();

  r.get("/gp/:wardId/profile", auth, async (req, res) => {
    const ward = await db.get("SELECT w.*, b.name_hi AS block_hi, b.name_en AS block_en, b.district_id, b.code AS block_code, d.name_hi AS district_hi, d.name_en AS district_en, d.state_id, s.name_hi AS state_hi, s.name_en AS state_en FROM wards w LEFT JOIN blocks b ON b.id=w.block_id LEFT JOIN districts d ON d.id=b.district_id LEFT JOIN states s ON s.id=d.state_id WHERE w.id = ?", [req.params.wardId]);
    if (!ward) return res.status(404).json({ error: "not_found" });
    const profile = await db.get("SELECT * FROM gp_profiles WHERE ward_id = ?", [req.params.wardId]);
    res.json({ ward, profile: profile || null });
  });

  r.put("/gp/:wardId/profile", auth, async (req, res) => {
    const sc = await scopeFor(db, req.user, "id");
    const allowed = await db.get(`SELECT id FROM wards WHERE id = ? AND ${sc.sql}`, [req.params.wardId, ...sc.params]);
    if (!allowed) return res.status(403).json({ error: "out_of_scope" });
    const b = req.body || {};
    const existing = await db.get("SELECT * FROM gp_profiles WHERE ward_id = ?", [req.params.wardId]);
    const rec = {
      id: existing ? existing.id : `gpp_${req.params.wardId}`,
      ward_id: req.params.wardId,
      sarpanch_name: b.sarpanch_name || null,
      sarpanch_mobile: b.sarpanch_mobile || null,
      secretary_name: b.secretary_name || null,
      secretary_mobile: b.secretary_mobile || null,
      updated_at: nowISO(),
    };
    await db.upsert("gp_profiles", rec, "id");
    await audit(db, req.user.id, "update", "gp_profiles", rec.id);
    res.json(rec);
  });

  r.get("/gp", auth, async (req, res) => {
    const sc = await scopeFor(db, req.user, "w.id");
    const rows = await db.all(
      `SELECT w.*, b.name_en AS block_en, b.name_hi AS block_hi, p.sarpanch_name, p.secretary_name
       FROM wards w LEFT JOIN blocks b ON b.id=w.block_id
       LEFT JOIN gp_profiles p ON p.ward_id=w.id
       WHERE w.kind='gp' AND ${sc.sql} ORDER BY w.name_en`,
      sc.params
    );
    res.json(rows);
  });

  return r;
};
