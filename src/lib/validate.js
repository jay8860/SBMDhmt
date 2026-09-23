function requireFields(body, fields) {
  for (const f of fields) {
    if (body[f] === undefined || body[f] === null || body[f] === "") {
      return `${f}_required`;
    }
  }
  return null;
}

function pinOk(pin) {
  return /^\d{4,6}$/.test(String(pin || ""));
}

module.exports = { requireFields, pinOk };
