const { uid, nowISO, ROLES, normalizeRole } = require("../lib/ids");
const { requireRole } = require("../auth/middleware");
const { hashPin } = require("../auth/pin");
const { audit } = require("../lib/audit");

module.exports = function userRoutes(db, { auth }) {
  const r = require("express").Router();

  r.get("/users", auth, requireRole("admin", "supervisor", "state_admin", "gp"), async (req, res) => {
    let sql = `SELECT u.id,u.name,u.phone,u.role,u.block_id,u.ward_id,u.shg_name,u.active,u.created_at,u.aadhaar,u.district_id,
                      w.name_hi AS ward_hi
               FROM users u LEFT JOIN wards w ON w.id = u.ward_id WHERE 1=1`;
    const params = [];
    if (req.user.role === "supervisor") {
      sql += " AND u.block_id = ?";
      params.push(req.user.block_id);
    } else if (req.user.role === "gp") {
      sql += " AND u.ward_id = ?";
      params.push(req.user.ward_id);
    }
    sql += " ORDER BY u.role, u.name";
    const users = await db.all(sql, params);
    const assigns = await db.all("SELECT * FROM user_assignments");
    const byUser = {};
    assigns.forEach((a) => { (byUser[a.user_id] || (byUser[a.user_id] = [])).push(a); });
    res.json(users.map((u) => ({ ...u, assignments: byUser[u.id] || [] })));
  });

  r.post("/users", auth, requireRole("admin", "supervisor", "state_admin", "gp"), async (req, res) => {
    const b = req.body || {};
    const role = normalizeRole(ROLES.includes(b.role) ? b.role : "swachhagrahi");
    if (req.user.role === "supervisor" && !["swachhagrahi", "didi"].includes(role)) {
      return res.status(403).json({ error: "supervisor_can_only_manage_field_staff" });
    }
    if (req.user.role === "gp" && !["swachhagrahi", "didi"].includes(role)) {
      return res.status(403).json({ error: "gp_can_only_manage_swachhagrahi" });
    }
    const existing = b.id ? await db.get("SELECT * FROM users WHERE id = ?", [b.id]) : null;
    const id = b.id || uid("usr_");
    const pin = b.pin ? hashPin(b.pin) : (existing ? existing.pin : hashPin("1234"));
    await db.upsert("users", {
      id, name: b.name, phone: b.phone, pin, role,
      block_id: b.block_id || null, ward_id: b.ward_id || null,
      shg_name: b.shg_name || null, active: b.active === 0 ? 0 : 1,
      created_at: existing ? existing.created_at : nowISO(),
      aadhaar: b.aadhaar || null, district_id: b.district_id || req.user.district_id || null,
    }, "id");
    if (Array.isArray(b.assignments)) {
      const old = await db.all("SELECT id FROM user_assignments WHERE user_id = ?", [id]);
      for (const o of old) await db.run("DELETE FROM user_assignments WHERE id = ?", [o.id]);
      for (const a of b.assignments) {
        await db.upsert("user_assignments", {
          id: a.id || uid("uas_"), user_id: id, village_id: a.village_id || null, ward_id: a.ward_id || b.ward_id || null,
        }, "id");
      }
    }
    await audit(db, req.user.id, "upsert", "users", id);
    const out = await db.get("SELECT id,name,phone,role,block_id,ward_id,shg_name,active,aadhaar,district_id FROM users WHERE id = ?", [id]);
    out.assignments = await db.all("SELECT * FROM user_assignments WHERE user_id = ?", [id]);
    res.json(out);
  });

  return r;
};
