const path = require("path");
const express = require("express");
const db = require("./src/db");
const { seed } = require("./src/seed");
const { hashPin } = require("./src/auth/pin");
const { uid, nowISO } = require("./src/lib/ids");
const mountRoutes = require("./src/routes");

const app = express();
app.use(express.json({ limit: "12mb" }));
app.disable("x-powered-by");
app.get("/sw.js", (req, res) => {
  res.set("Cache-Control", "no-cache");
  res.sendFile(path.join(__dirname, "public", "sw.js"));
});
app.use(express.static(path.join(__dirname, "public"), { etag: true, setHeaders(res, filePath) {
  if (/\.(js|css|html)$/i.test(filePath)) res.setHeader("Cache-Control", "no-cache");
} }));

mountRoutes(app, db);

app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) return res.status(404).json({ error: "not_found" });
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.use((err, _req, res, _next) => {
  console.error("ERR", err);
  res.status(500).json({ error: "server_error", message: err.message });
});

const PORT = process.env.PORT || 3000;
(async () => {
  await db.migrate();
  await seed(db, { hashPin, uid, nowISO });
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Swachh SBM running on :${PORT}  [${db.USE_PG ? "postgres" : "sqlite"}]`);
  });
})();
