function auth(db) {
  return async function authMw(req, res, next) {
    const t = (req.headers.authorization || "").replace(/^Bearer\s+/i, "") || req.query.token;
    if (!t) return res.status(401).json({ error: "no_token" });
    const s = await db.get("SELECT * FROM sessions WHERE token = ?", [t]);
    if (!s) return res.status(401).json({ error: "bad_token" });
    const u = await db.get("SELECT * FROM users WHERE id = ?", [s.user_id]);
    if (!u || !Number(u.active)) return res.status(401).json({ error: "inactive" });
    delete u.pin;
    req.user = u;
    next();
  };
}

const requireRole = (...roles) => (req, res, next) => {
  const r = req.user && req.user.role;
  const expanded = roles.flatMap((x) => (x === "swachhagrahi" ? ["swachhagrahi", "didi"] : [x]));
  return expanded.includes(r) ? next() : res.status(403).json({ error: "forbidden" });
};

module.exports = { auth, requireRole };
