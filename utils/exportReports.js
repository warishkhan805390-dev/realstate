const { Parser } = require('json2csv');
const ExcelJS = require('exceljs');

const exportToCSV = (data, fields) => {
  const json2csvParser = new Parser({ fields });
  return json2csvParser.parse(data);
};

const exportToExcel = async (data, sheetName, columns) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName || 'Sheet1');

  worksheet.columns = columns;

  data.forEach((row) => {
    worksheet.addRow(row);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

module.exports = { exportToCSV, exportToExcel };
