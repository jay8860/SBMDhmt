const { today } = require("../lib/ids");
const { scopeFor } = require("../auth/scope");
const { toCsv } = require("../services/exportCsv");
const { writeXlsx } = require("../services/exportXlsx");
const { htmlTable } = require("../services/exportPdf");

const EXPORTS = {
  households: `SELECT h.code, h.head_name, h.phone, h.house_no, h.category, h.fee_slab, h.family_size,
                 b.name_en AS block, w.name_en AS ward, h.lat, h.lng, h.toilet, h.soak_pit, h.compost_pit, h.created_at
               FROM households h LEFT JOIN wards w ON w.id=h.ward_id LEFT JOIN blocks b ON b.id=w.block_id
               WHERE h.active=1 AND __SCOPE__ ORDER BY b.name_en, w.name_en, h.house_no`,
  collections: `SELECT c.service_date, c.ts, hh.code AS household_code, hh.head_name, w.name_en AS ward, b.name_en AS block,
                  u.name AS collected_by, c.wet_kg, c.dry_kg, c.hazard_kg, c.segregated, c.status, c.lat, c.lng, c.notes
                FROM collections c LEFT JOIN households hh ON hh.id=c.household_id
                LEFT JOIN wards w ON w.id=c.ward_id LEFT JOIN blocks b ON b.id=w.block_id
                LEFT JOIN users u ON u.id=c.user_id WHERE __SCOPE__ ORDER BY c.ts DESC`,
  payments: `SELECT p.receipt_no, p.ts, p.period, p.amount, p.mode, hh.code AS household_code, hh.head_name,
               w.name_en AS ward, b.name_en AS block, u.name AS collected_by
             FROM payments p LEFT JOIN households hh ON hh.id=p.household_id
             LEFT JOIN wards w ON w.id=p.ward_id LEFT JOIN blocks b ON b.id=w.block_id
             LEFT JOIN users u ON u.id=p.user_id WHERE __SCOPE__ ORDER BY p.ts DESC`,
  grievances: `SELECT g.ts, g.category, g.description, g.status, g.priority, g.raised_by_name,
                 hh.code AS household_code, w.name_en AS ward, b.name_en AS block, g.resolution, g.resolved_ts
               FROM grievances g LEFT JOIN households hh ON hh.id=g.household_id
               LEFT JOIN wards w ON w.id=g.ward_id LEFT JOIN blocks b ON b.id=w.block_id
               WHERE __SCOPE__ ORDER BY g.ts DESC`,
  assets: `SELECT a.asset_type, a.name, a.condition, a.capacity, a.ownership, a.toilet_count, a.reason, a.installed_on, w.name_en AS ward,
             b.name_en AS block, a.lat, a.lng, a.notes, a.ts
           FROM assets a LEFT JOIN wards w ON w.id=a.ward_id LEFT JOIN blocks b ON b.id=w.block_id
           WHERE __SCOPE__ ORDER BY a.asset_type, a.name`,
  attendance: `SELECT a.service_date, u.name AS didi, u.shg_name, w.name_en AS ward, a.in_ts, a.out_ts, a.lat, a.lng
               FROM attendance a LEFT JOIN users u ON u.id=a.user_id LEFT JOIN wards w ON w.id=a.ward_id
               WHERE __SCOPE__ ORDER BY a.service_date DESC`,
  villages: `SELECT v.name_en, v.name_hi, w.name_en AS gp, v.fam_st, v.fam_sc, v.fam_obc, v.fam_gen, v.fam_total,
               v.pop_st, v.pop_sc, v.pop_obc, v.pop_gen, v.pop_total FROM villages v
               LEFT JOIN wards w ON w.id=v.ward_id WHERE __SCOPE__ ORDER BY v.name_en`,
  ihhl: `SELECT i.status, hh.head_name, hh.code, i.incentive_amount, i.incentive_status, i.incentive_date, w.name_en AS ward
         FROM ihhl i LEFT JOIN households hh ON hh.id=i.household_id LEFT JOIN wards w ON w.id=i.ward_id WHERE __SCOPE__`,
  schools: `SELECT s.name, s.kind, s.toilets_total, s.toilets_functional, s.toilets_non_functional, w.name_en AS ward
            FROM schools s LEFT JOIN wards w ON w.id=s.ward_id WHERE __SCOPE__`,
  anganwadis: `SELECT a.name, a.toilets_total, a.toilets_functional, a.toilets_non_functional, w.name_en AS ward
               FROM anganwadis a LEFT JOIN wards w ON w.id=a.ward_id WHERE __SCOPE__`,
  hotspots: `SELECT h.name, h.workflow, h.cleanliness_status, h.lat, h.lng, w.name_en AS ward, h.ts
             FROM hotspots h LEFT JOIN wards w ON w.id=h.ward_id WHERE __SCOPE__`,
  buildings: `SELECT b.kind, b.name, b.toilets_total, b.toilets_functional, b.toilets_non_functional, w.name_en AS ward
              FROM buildings b LEFT JOIN wards w ON w.id=b.ward_id WHERE __SCOPE__`,
};

const ALIAS = {
  households: "h", collections: "c", payments: "p", grievances: "g", assets: "a",
  attendance: "a", villages: "v", ihhl: "i", schools: "s", anganwadis: "a", hotspots: "h", buildings: "b",
};

async function exportRows(db, user, entity, query) {
  const base = EXPORTS[entity];
  if (!base) return null;
  const alias = ALIAS[entity];
  const sc = await scopeFor(db, user);
  let where = sc.sql.replace(/ward_id/g, `${alias}.ward_id`);
  const params = [...sc.params];
  if (query.from && ["collections", "attendance"].includes(entity)) {
    where += ` AND ${alias}.service_date BETWEEN ? AND ?`;
    params.push(query.from, query.to || today());
  } else if (query.from && base.includes(`${alias}.ts`)) {
    where += ` AND ${alias}.ts >= ?`;
    params.push(query.from);
  }
  if (query.ward_id) {
    where += ` AND ${alias}.ward_id = ?`;
    params.push(query.ward_id);
  }
  if (query.block_id) {
    where += ` AND ${alias}.ward_id IN (SELECT id FROM wards WHERE block_id = ?)`;
    params.push(query.block_id);
  }
  return db.all(base.replace("__SCOPE__", where), params);
}

module.exports = function exportRoutes(db, { auth }) {
  const r = require("express").Router();

  r.get("/export/:entity.csv", auth, async (req, res) => {
    const rows = await exportRows(db, req.user, req.params.entity, req.query);
    if (!rows) return res.status(404).json({ error: "unknown_entity" });
    res.type("text/csv").set("Content-Disposition", `attachment; filename="${req.params.entity}-${today()}.csv"`).send(toCsv(rows));
  });

  r.get("/export/:entity.xlsx", auth, async (req, res) => {
    const rows = await exportRows(db, req.user, req.params.entity, req.query);
    if (!rows) return res.status(404).json({ error: "unknown_entity" });
    await writeXlsx(res, `${req.params.entity}-${today()}`, rows);
  });

  r.get("/export/:entity.pdf", auth, async (req, res) => {
    const rows = await exportRows(db, req.user, req.params.entity, req.query);
    if (!rows) return res.status(404).json({ error: "unknown_entity" });
    res.type("html").send(htmlTable(req.params.entity, rows));
  });

  return r;
};
