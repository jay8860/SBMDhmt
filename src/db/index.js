const path = require("path");
const fs = require("fs");

const ROOT = path.join(__dirname, "..", "..");
const USE_PG = !!process.env.DATABASE_URL;
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, "..", "data");

let sqlite = null;
let pgPool = null;

if (USE_PG) {
  const { Pool } = require("pg");
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSL === "off" ? false : { rejectUnauthorized: false },
    max: 8,
  });
} else {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const Database = require("better-sqlite3");
  sqlite = new Database(path.join(DATA_DIR, "swachh.db"));
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
}

function toPg(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

async function all(sql, params = []) {
  if (USE_PG) {
    const r = await pgPool.query(toPg(sql), params);
    return r.rows;
  }
  return sqlite.prepare(sql).all(params);
}

async function get(sql, params = []) {
  const rows = await all(sql, params);
  return rows[0] || null;
}

async function run(sql, params = []) {
  if (USE_PG) {
    const r2 = await pgPool.query(toPg(sql), params);
    return { changes: r2.rowCount };
  }
  const r = sqlite.prepare(sql).run(params);
  return { changes: r.changes };
}

async function exec(sql) {
  if (USE_PG) {
    await pgPool.query(sql);
    return;
  }
  sqlite.exec(sql);
}

async function upsert(table, obj, conflictKey = "id") {
  const cols = Object.keys(obj);
  const vals = cols.map((c) => obj[c]);
  const placeholders = cols.map(() => "?").join(",");
  if (USE_PG) {
    const updates = cols.filter((c) => c !== conflictKey).map((c) => `${c}=EXCLUDED.${c}`).join(",");
    const sql = `INSERT INTO ${table} (${cols.join(",")}) VALUES (${placeholders})
                 ON CONFLICT (${conflictKey}) DO UPDATE SET ${updates}`;
    return run(sql, vals);
  }
  return run(`INSERT OR REPLACE INTO ${table} (${cols.join(",")}) VALUES (${placeholders})`, vals);
}

async function tableColumns(table) {
  if (USE_PG) {
    const rows = await all(
      `SELECT column_name AS name FROM information_schema.columns WHERE table_name = ?`,
      [table]
    );
    return rows.map((r) => r.name);
  }
  return sqlite.prepare(`PRAGMA table_info(${table})`).all().map((r) => r.name);
}

async function addColumn(table, def) {
  const name = def.split(/\s+/)[0];
  const cols = await tableColumns(table);
  if (cols.includes(name)) return;
  try {
    await exec(`ALTER TABLE ${table} ADD COLUMN ${def}`);
  } catch (e) {
    if (!/duplicate|exists/i.test(e.message || "")) throw e;
  }
}

const dbApi = { all, get, run, exec, upsert, addColumn, tableColumns, USE_PG, DATA_DIR, ROOT };
dbApi.migrate = () => require("./migrate")(dbApi);
module.exports = dbApi;
