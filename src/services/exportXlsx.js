const ExcelJS = require("exceljs");

async function writeXlsx(res, entity, rows) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Swachh SBM";
  const ws = wb.addWorksheet(entity.slice(0, 30));
  const cols = rows.length ? Object.keys(rows[0]) : ["no_data"];
  ws.columns = cols.map((c) => ({ header: c.replace(/_/g, " ").toUpperCase(), key: c, width: Math.min(28, Math.max(12, c.length + 6)) }));
  rows.forEach((r) => ws.addRow(r));
  ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF15803D" } };
  ws.views = [{ state: "frozen", ySplit: 1 }];
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: cols.length } };
  res.set("Content-Disposition", `attachment; filename="${entity}.xlsx"`);
  res.type("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  await wb.xlsx.write(res);
  res.end();
}

module.exports = { writeXlsx };
