// src/utils/exportToExcel.ts

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

/**
 * Exports JSON data to an Excel file.
 * @param data - Array of objects representing the data to export.
 * @param fileName - The desired file name for the downloaded Excel file.
 */
export const exportToExcel = <T>(data: T[], fileName: string): void => {
  // Create a new workbook and add a worksheet with the provided data
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

  // Create a buffer for the Excel data
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

  // Create a Blob from the Excel buffer and trigger the download
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${fileName}.xlsx`);
};
