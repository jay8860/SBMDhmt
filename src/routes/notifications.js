const { nowISO } = require("../lib/ids");

module.exports = function notificationRoutes(db, { auth }) {
  const r = require("express").Router();
  r.get("/notifications", auth, async (req, res) => {
    const rows = await db.all("SELECT * FROM notifications WHERE user_id = ? ORDER BY ts DESC LIMIT 80", [req.user.id]);
    res.json(rows);
  });
  r.post("/notifications/:id/read", auth, async (req, res) => {
    await db.run("UPDATE notifications SET read_at = ? WHERE id = ? AND user_id = ?", [nowISO(), req.params.id, req.user.id]);
    res.json({ ok: true });
  });
  r.get("/audit-logs", auth, async (req, res) => {
    if (!["admin", "state_admin", "supervisor"].includes(req.user.role)) {
      return res.status(403).json({ error: "forbidden" });
    }
    const rows = await db.all("SELECT a.*, u.name AS actor_name FROM audit_logs a LEFT JOIN users u ON u.id=a.actor_id ORDER BY a.ts DESC LIMIT 200");
    res.json(rows);
  });
  return r;
};
