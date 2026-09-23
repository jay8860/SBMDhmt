const { uid, nowISO, pick } = require("./ids");
const { audit } = require("./audit");
const { scopeFor } = require("../auth/scope");

function scopedList(db, table, user, extraWhere, extraParams) {
  return async (req, res) => {
    const sc = await scopeFor(db, req.user);
    let sql = `SELECT * FROM ${table} WHERE ${sc.sql}`;
    const params = [...sc.params];
    if (req.query.ward_id) { sql += " AND ward_id = ?"; params.push(req.query.ward_id); }
    if (extraWhere) { sql += ` AND ${extraWhere}`; if (extraParams) params.push(...extraParams(req)); }
    sql += " ORDER BY rowid DESC LIMIT 2000";
    res.json(await db.all(sql, params));
  };
}

function upsertHandler(db, table, fields, { defaults } = {}) {
  return async (req, res) => {
    const b = req.body || {};
    const rec = pick(b, fields);
    rec.id = b.id || uid(`${table.slice(0, 3)}_`);
    if (fields.includes("updated_at")) rec.updated_at = nowISO();
    if (fields.includes("created_at") && !b.id) rec.created_at = nowISO();
    if (fields.includes("ts") && !rec.ts) rec.ts = nowISO();
    if (defaults) Object.assign(rec, defaults(req, rec));
    await db.upsert(table, rec, "id");
    await audit(db, req.user.id, b.id ? "update" : "create", table, rec.id);
    res.json(await db.get(`SELECT * FROM ${table} WHERE id = ?`, [rec.id]));
  };
}

module.exports = { scopedList, upsertHandler };
