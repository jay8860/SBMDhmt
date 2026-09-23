const { today } = require("../lib/ids");
const { scopeFor } = require("../auth/scope");

async function buildDashboard(db, user, query) {
  const from = query.from || new Date(Date.now() - 29 * 864e5).toISOString().slice(0, 10);
  const to = query.to || today();
  const sc = await scopeFor(db, user);
  let extra = "", extraParams = [];
  if (query.block_id) {
    const w = await db.all("SELECT id FROM wards WHERE block_id = ?", [query.block_id]);
    const ids = w.map((x) => x.id);
    extra = ids.length ? ` AND ward_id IN (${ids.map(() => "?").join(",")})` : " AND 1=0";
    extraParams = ids;
  }
  if (query.ward_id) {
    extra += " AND ward_id = ?";
    extraParams.push(query.ward_id);
  }
  const W = `${sc.sql}${extra}`;
  const P = [...sc.params, ...extraParams];
  const hh = await db.get(`SELECT COUNT(*) AS n FROM households WHERE active=1 AND ${W}`, P);
  const totalHH = Number(hh.n) || 0;
  const colAgg = await db.get(
    `SELECT COUNT(*) AS services, COUNT(DISTINCT household_id) AS covered,
            COALESCE(SUM(wet_kg),0) AS wet, COALESCE(SUM(dry_kg),0) AS dry, COALESCE(SUM(hazard_kg),0) AS hazard,
            COALESCE(SUM(segregated),0) AS seg
     FROM collections WHERE service_date BETWEEN ? AND ? AND ${W}`,
    [from, to, ...P]
  );
  const todayAgg = await db.get(
    `SELECT COUNT(*) AS services, COUNT(DISTINCT household_id) AS covered
     FROM collections WHERE service_date = ? AND ${W}`,
    [today(), ...P]
  );
  const payAgg = await db.get(
    `SELECT COALESCE(SUM(amount),0) AS total, COUNT(*) AS n FROM payments
     WHERE ts BETWEEN ? AND ? AND ${W}`,
    [from, to + "T23:59:59Z", ...P]
  );
  const hhPay = await db.get(
    `SELECT COUNT(DISTINCT p.household_id) AS n FROM payments p
     JOIN households h ON h.id=p.household_id WHERE h.category='household' AND ${W.replace(/ward_id/g, "p.ward_id")} AND p.ts BETWEEN ? AND ?`,
    [...P, from, to + "T23:59:59Z"]
  );
  const shopPay = await db.get(
    `SELECT COUNT(DISTINCT p.household_id) AS n, COALESCE(SUM(p.amount),0) AS total FROM payments p
     JOIN households h ON h.id=p.household_id WHERE h.category='shop' AND ${W.replace(/ward_id/g, "p.ward_id")} AND p.ts BETWEEN ? AND ?`,
    [...P, from, to + "T23:59:59Z"]
  );
  const shopTotal = await db.get(`SELECT COUNT(*) AS n FROM households WHERE active=1 AND category='shop' AND ${W}`, P);
  const griev = await db.all(`SELECT status, COUNT(*) AS n FROM grievances WHERE ${W} GROUP BY status`, P);
  const daily = await db.all(
    `SELECT service_date AS d, COUNT(*) AS services, COUNT(DISTINCT household_id) AS covered,
            COALESCE(SUM(wet_kg+dry_kg+hazard_kg),0) AS kg
     FROM collections WHERE service_date BETWEEN ? AND ? AND ${W}
     GROUP BY service_date ORDER BY service_date`,
    [from, to, ...P]
  );
  const byWard = await db.all(
    `SELECT w.id, w.name_hi, w.name_en, w.block_id, w.kind,
            (SELECT COUNT(*) FROM households h WHERE h.ward_id=w.id AND h.active=1) AS households,
            (SELECT COUNT(DISTINCT c.household_id) FROM collections c WHERE c.ward_id=w.id AND c.service_date=?) AS covered_today,
            (SELECT COUNT(*) FROM collections c WHERE c.ward_id=w.id AND c.service_date BETWEEN ? AND ?) AS services,
            (SELECT COALESCE(SUM(p.amount),0) FROM payments p WHERE p.ward_id=w.id AND p.ts BETWEEN ? AND ?) AS fees
     FROM wards w WHERE ${sc.sql.replace("ward_id", "w.id")} ORDER BY w.name_en`,
    [today(), from, to, from, to + "T23:59:59Z", ...sc.params]
  );
  const byDidi = await db.all(
    `SELECT u.id, u.name, u.shg_name, u.ward_id, u.role,
            (SELECT COUNT(*) FROM collections c WHERE c.user_id=u.id AND c.service_date BETWEEN ? AND ?) AS services,
            (SELECT COALESCE(SUM(p.amount),0) FROM payments p WHERE p.user_id=u.id AND p.ts BETWEEN ? AND ?) AS fees,
            (SELECT COUNT(*) FROM attendance a WHERE a.user_id=u.id AND a.service_date BETWEEN ? AND ?) AS days
     FROM users u WHERE u.role IN ('didi','swachhagrahi') AND u.active=1 AND ${sc.sql.replace("ward_id", "u.ward_id")}`,
    [from, to, from, to + "T23:59:59Z", from, to, ...sc.params]
  );
  const assets = await db.all(`SELECT asset_type, condition, COUNT(*) AS n FROM assets WHERE ${W} GROUP BY asset_type, condition`, P);
  const ihhl = await db.all(`SELECT status, COUNT(*) AS n FROM ihhl WHERE ${W} GROUP BY status`, P);
  const schools = await db.get(`SELECT COUNT(*) AS n FROM schools WHERE ${W}`, P);
  const anganwadis = await db.get(`SELECT COUNT(*) AS n FROM anganwadis WHERE ${W}`, P);
  const hotspots = await db.all(`SELECT workflow, COUNT(*) AS n FROM hotspots WHERE ${W} GROUP BY workflow`, P);
  const census = await db.get(
    `SELECT COALESCE(SUM(fam_total),0) AS families, COALESCE(SUM(pop_total),0) AS population,
            COALESCE(SUM(fam_st),0) AS fam_st, COALESCE(SUM(fam_sc),0) AS fam_sc,
            COALESCE(SUM(fam_obc),0) AS fam_obc, COALESCE(SUM(fam_gen),0) AS fam_gen
     FROM villages WHERE ${W}`,
    P
  );
  const services = Number(colAgg.services) || 0;
  return {
    range: { from, to },
    kpi: {
      households: totalHH,
      services,
      covered: Number(colAgg.covered) || 0,
      coverage_pct: totalHH ? Math.round((Number(colAgg.covered) / totalHH) * 1000) / 10 : 0,
      today_covered: Number(todayAgg.covered) || 0,
      today_coverage_pct: totalHH ? Math.round((Number(todayAgg.covered) / totalHH) * 1000) / 10 : 0,
      wet_kg: Math.round(Number(colAgg.wet) * 10) / 10,
      dry_kg: Math.round(Number(colAgg.dry) * 10) / 10,
      hazard_kg: Math.round(Number(colAgg.hazard) * 10) / 10,
      segregation_pct: services ? Math.round((Number(colAgg.seg) / services) * 1000) / 10 : 0,
      fees_collected: Math.round(Number(payAgg.total)),
      fee_txns: Number(payAgg.n) || 0,
      paying_families: Number(hhPay.n) || 0,
      shops: Number(shopTotal.n) || 0,
      paying_shops: Number(shopPay.n) || 0,
      shop_fees: Math.round(Number(shopPay.total) || 0),
      schools: Number(schools.n) || 0,
      anganwadis: Number(anganwadis.n) || 0,
    },
    grievances: griev,
    daily,
    by_ward: byWard.filter((w) => !query.block_id || w.block_id === query.block_id),
    by_didi: byDidi,
    assets,
    ihhl,
    hotspots,
    census,
  };
}

module.exports = { buildDashboard };
