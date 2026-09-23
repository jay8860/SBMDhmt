const { scopeFor } = require("../auth/scope");
const SYNCABLE = require("../db/syncable");

module.exports = function bootstrapRoutes(db, { auth }) {
  const r = require("express").Router();
  r.get("/bootstrap", auth, async (req, res) => {
    const u = req.user;
    const states = await db.all("SELECT * FROM states ORDER BY name_en");
    const districts = await db.all("SELECT * FROM districts ORDER BY name_en");
    const blocks = await db.all("SELECT * FROM blocks ORDER BY name_en");
    const wards = await db.all("SELECT * FROM wards ORDER BY name_en");
    const sc = await scopeFor(db, u);
    const since = new Date(Date.now() - 45 * 864e5).toISOString().slice(0, 10);
    const tables = {
      households: `SELECT * FROM households WHERE active = 1 AND ${sc.sql} ORDER BY house_no, head_name`,
      collections: `SELECT * FROM collections WHERE service_date >= ? AND ${sc.sql} ORDER BY ts DESC`,
      payments: `SELECT * FROM payments WHERE ${sc.sql} ORDER BY ts DESC`,
      grievances: `SELECT * FROM grievances WHERE ${sc.sql} ORDER BY ts DESC`,
      assets: `SELECT * FROM assets WHERE ${sc.sql}`,
    };
    const households = await db.all(tables.households, sc.params);
    const collections = await db.all(tables.collections, [since, ...sc.params]);
    const payments = await db.all(tables.payments, sc.params);
    const grievances = await db.all(tables.grievances, sc.params);
    const assets = await db.all(tables.assets, sc.params);
    const attendance = await db.all("SELECT * FROM attendance WHERE user_id = ? ORDER BY service_date DESC", [u.id]);

    const extra = {};
    const extraTables = [
      "gp_profiles", "villages", "schools", "anganwadis", "buildings", "ihhl",
      "hotspots", "cleanliness_cases", "monitoring_visits", "greywater_cases",
      "swm_gp", "waste_sales", "pwmu_shipments", "honorarium", "waste_category_totals",
    ];
    for (const t of extraTables) {
      try {
        extra[t] = await db.all(`SELECT * FROM ${t} WHERE ${sc.sql}`, sc.params);
      } catch (e) {
        extra[t] = [];
      }
    }
    extra.notifications = await db.all("SELECT * FROM notifications WHERE user_id = ? ORDER BY ts DESC LIMIT 50", [u.id]);
    extra.assignments = await db.all("SELECT * FROM user_assignments WHERE user_id = ?", [u.id]);

    res.json({
      server_time: new Date().toISOString(), user: u, states, districts, blocks, wards,
      households, collections, payments, grievances, assets, attendance,
      syncable: Object.keys(SYNCABLE),
      ...extra,
    });
  });
  return r;
};
