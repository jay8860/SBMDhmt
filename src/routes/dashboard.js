const { buildDashboard } = require("../services/dashboard");

module.exports = function dashboardRoutes(db, { auth }) {
  const r = require("express").Router();
  r.get("/dashboard", auth, async (req, res) => {
    res.json(await buildDashboard(db, req.user, req.query));
  });
  return r;
};
