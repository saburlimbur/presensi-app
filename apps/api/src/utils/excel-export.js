import ExcelJS from "exceljs";
import { formatJakartaDate } from "./date.js";

const FILTERS_SHEET_COLUMNS = [
  {
    header: "Filter",
    key: "k",
    width: 18,
  },
  {
    header: "Value",
    key: "v",
    width: 36,
  },
];

const styleHeaderRow = (sheet) => {
  sheet.getRow(1).font = {
    bold: true,
  };
  sheet.getRow(1).alignment = {
    vertical: "middle",
    horizontal: "center",
  };
};

export const addDataSheet = (workbook, { name, columns, rows }) => {
  const sheet = workbook.addWorksheet(name);
  sheet.columns = columns;
  styleHeaderRow(sheet);
  rows.forEach((row) => sheet.addRow(row));
  return sheet;
};

export const addFiltersSheet = (workbook, filters, totalRows) => {
  const sheet = workbook.addWorksheet("Filters");
  sheet.columns = FILTERS_SHEET_COLUMNS;
  styleHeaderRow(sheet);

  Object.entries(filters).forEach(([k, v]) => {
    sheet.addRow({
      k,
      v: v instanceof Date ? formatJakartaDate(v) : String(v ?? ""),
    });
  });
  sheet.addRow({
    k: "exportedAt",
    v: new Date().toISOString(),
  });
  sheet.addRow({
    k: "totalRows",
    v: totalRows,
  });
  return sheet;
};

export const buildWorkbook = ({ sheets, filters }) => {
  const workbook = new ExcelJS.Workbook();
  workbook.created = new Date();

  let totalRows = 0;
  sheets.forEach((s) => {
    addDataSheet(workbook, s);
    totalRows += s.rows.length;
  });

  if (filters) addFiltersSheet(workbook, filters, totalRows);
  return workbook;
};

export const buildExportFilename = (prefix, filters = {}) => {
  if (filters.date) return `${prefix}_${formatJakartaDate(filters.date)}.xlsx`;
  if (filters.dateFrom && filters.dateTo) {
    return `${prefix}_${formatJakartaDate(filters.dateFrom)}_${formatJakartaDate(filters.dateTo)}.xlsx`;
  }
  if (filters.dateFrom) {
    return `${prefix}_from_${formatJakartaDate(filters.dateFrom)}.xlsx`;
  }
  return `${prefix}_${formatJakartaDate(new Date())}.xlsx`;
};
