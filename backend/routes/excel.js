const router = require("express").Router();
const ExcelJS = require("exceljs");

router.post("/export", async (req, res) => {
  const { filename = "export", sheetName = "Sheet1", columns = [], rows = [] } = req.body;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "SmartERP";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(sheetName);
  sheet.columns = columns.map((c) => ({ header: c.header, key: c.key, width: c.width || 18 }));
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFEDEFF7" } };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF121A3D" } };
  rows.forEach((r) => sheet.addRow(r));

  const safeFilename = filename.replace(/[^a-zA-Z0-9-_]/g, "_");
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}.xlsx"`);
  await workbook.xlsx.write(res);
  res.end();
});

module.exports = router;
