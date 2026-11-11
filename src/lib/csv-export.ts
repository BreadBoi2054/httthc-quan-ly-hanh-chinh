/**
 * Xuất dữ liệu bảng Sổ theo dõi hành chính ra tệp CSV chuẩn UTF-8 BOM (mở trực tiếp trên Microsoft Excel đúng tiếng Việt)
 * Kèm cơ chế khử độc công thức bảng tính (CSV Formula Injection Prevention theo OWASP).
 */

function sanitizeCsvCell(raw: string | number | null | undefined): string {
  const str = raw == null ? "" : String(raw).replace(/\r?\n/g, " ").trim();
  const safeFormula = /^[=+\-@]/.test(str) ? `'${str}` : str;
  const escaped = safeFormula.replace(/"/g, '""');
  return `"${escaped}"`;
}

export function downloadOfficialCsv(
  filename: string,
  headers: string[],
  rows: Array<Array<string | number | null | undefined>>
): void {
  const headerLine = headers.map(sanitizeCsvCell).join(",");
  const bodyLines = rows.map((row) => row.map(sanitizeCsvCell).join(","));
  const csvContent = `\uFEFF${[headerLine, ...bodyLines].join("\r\n")}`;

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
