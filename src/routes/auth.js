const express = require("express");
const crypto = require("crypto");
const { verifyPin, hashPin } = require("../auth/pin");
const { nowISO, normalizeRole, isFieldRole } = require("../lib/ids");
const { pinOk } = require("../lib/validate");

module.exports = function authRoutes(db, { auth }) {
  const r = express.Router();

  r.post("/login", async (req, res) => {
    const { phone, pin } = req.body || {};
    const u = await db.get("SELECT * FROM users WHERE phone = ?", [String(phone || "").trim()]);
    if (!u || !verifyPin(pin, u.pin)) return res.status(401).json({ error: "invalid_credentials" });
    if (!Number(u.active)) return res.status(403).json({ error: "inactive" });
    const token = crypto.randomBytes(24).toString("hex");
    await db.run("INSERT INTO sessions (token,user_id,created_at) VALUES (?,?,?)", [token, u.id, nowISO()]);
    delete u.pin;
    u.role = normalizeRole(u.role);
    const assignments = isFieldRole(u.role) || u.role === "gp"
      ? await db.all("SELECT * FROM user_assignments WHERE user_id = ?", [u.id])
      : [];
    res.json({ token, user: u, assignments });
  });

  r.post("/logout", auth, async (req, res) => {
    const t = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    await db.run("DELETE FROM sessions WHERE token = ?", [t]);
    res.json({ ok: true });
  });

  r.get("/me", auth, (req, res) => res.json({ user: req.user }));

  r.post("/me/pin", auth, async (req, res) => {
    const { pin } = req.body || {};
    if (!pinOk(pin)) return res.status(400).json({ error: "pin_must_be_4_to_6_digits" });
    await db.run("UPDATE users SET pin = ? WHERE id = ?", [hashPin(pin), req.user.id]);
    res.json({ ok: true });
  });

  return r;
};
