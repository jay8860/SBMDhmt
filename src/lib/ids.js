const crypto = require("crypto");

const nowISO = () => new Date().toISOString();
const today = () => new Date().toISOString().slice(0, 10);
const uid = (p = "") => p + crypto.randomUUID();
const num = (v) => (v === undefined || v === null || v === "" ? null : Number(v));
const int = (v, d = 0) => (v === undefined || v === null || v === "" ? d : parseInt(v, 10) || d);

function pick(obj, keys) {
  const out = {};
  for (const k of keys) if (obj[k] !== undefined) out[k] = obj[k];
  return out;
}

function sumInts(...vals) {
  return vals.reduce((s, v) => s + (Number(v) || 0), 0);
}

const FIELD_ROLES = ["didi", "swachhagrahi"];
const isFieldRole = (role) => FIELD_ROLES.includes(role);
const normalizeRole = (role) => (role === "didi" ? "swachhagrahi" : role);

const ROLES = ["state_admin", "admin", "supervisor", "gp", "swachhagrahi", "didi", "viewer"];

module.exports = {
  nowISO, today, uid, num, int, pick, sumInts, isFieldRole, normalizeRole, ROLES, FIELD_ROLES,
};
