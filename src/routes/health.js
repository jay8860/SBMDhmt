module.exports = function healthRoutes(db) {
  const r = require("express").Router();
  r.get("/health", async (_req, res) => {
    const b = await db.get("SELECT COUNT(*) AS n FROM blocks");
    res.json({ ok: true, driver: db.USE_PG ? "postgres" : "sqlite", blocks: Number(b.n), time: new Date().toISOString() });
  });
  return r;
};
