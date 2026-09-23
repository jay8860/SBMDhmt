const crypto = require("crypto");

function hashPin(pin, salt) {
  salt = salt || crypto.randomBytes(8).toString("hex");
  const h = crypto.scryptSync(String(pin), salt, 32).toString("hex");
  return `${salt}:${h}`;
}

function verifyPin(pin, stored) {
  if (!stored || !stored.includes(":")) return false;
  const [salt] = stored.split(":");
  return crypto.timingSafeEqual(Buffer.from(hashPin(pin, salt)), Buffer.from(stored));
}

module.exports = { hashPin, verifyPin };
