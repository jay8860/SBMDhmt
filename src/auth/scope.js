const { isFieldRole } = require("../lib/ids");

async function scopeFor(db, user, wardCol = "ward_id") {
  if (user.role === "state_admin" || user.role === "admin" || user.role === "viewer") {
    if (user.role === "admin" && user.district_id) {
      const wards = await db.all(
        `SELECT w.id FROM wards w JOIN blocks b ON b.id = w.block_id WHERE b.district_id = ?`,
        [user.district_id]
      );
      const ids = wards.map((w) => w.id);
      if (!ids.length) return { sql: "1=1", params: [] };
      return { sql: `${wardCol} IN (${ids.map(() => "?").join(",")})`, params: ids };
    }
    return { sql: "1=1", params: [] };
  }
  if (user.role === "supervisor") {
    const wards = await db.all("SELECT id FROM wards WHERE block_id = ?", [user.block_id]);
    const ids = wards.map((w) => w.id);
    if (!ids.length) return { sql: "1=0", params: [] };
    return { sql: `${wardCol} IN (${ids.map(() => "?").join(",")})`, params: ids };
  }
  if (user.role === "gp" || isFieldRole(user.role)) {
    const assigned = await db.all("SELECT ward_id, village_id FROM user_assignments WHERE user_id = ?", [user.id]);
    const wardIds = new Set();
    if (user.ward_id) wardIds.add(user.ward_id);
    assigned.forEach((a) => { if (a.ward_id) wardIds.add(a.ward_id); });
    const ids = [...wardIds];
    if (!ids.length) return { sql: `${wardCol} = ?`, params: [user.ward_id || ""] };
    return { sql: `${wardCol} IN (${ids.map(() => "?").join(",")})`, params: ids };
  }
  return { sql: `${wardCol} = ?`, params: [user.ward_id] };
}

module.exports = { scopeFor };
