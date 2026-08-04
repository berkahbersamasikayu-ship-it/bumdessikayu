import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getLogoBase64 } from '@/lib/get-logo-base64';

export async function buildExcel(
  title: string,
  headers: string[],
  rows: (string | number)[][]
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(title.slice(0, 30));

  sheet.mergeCells(1, 1, 1, headers.length);
  sheet.getCell(1, 1).value = title;
  sheet.getCell(1, 1).font = { bold: true, size: 13 };

  sheet.getRow(3).values = headers;
  sheet.getRow(3).font = { bold: true };

  rows.forEach((row) => sheet.addRow(row));

  headers.forEach((_, idx) => {
    sheet.getColumn(idx + 1).width = 18;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export function buildPdf(title: string, headers: string[], rows: (string | number)[][]): Buffer {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const logoBase64 = getLogoBase64();

  doc.setFontSize(13);
  autoTable(doc, {
    startY: 34,
    head: [headers],
    body: rows,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [30, 58, 138], halign: 'center' },
    didDrawPage: (data) => {
      const headerY = 15;

      if (logoBase64) {
        doc.addImage(logoBase64, 'JPEG', 14, 9, 18, 18);
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('BUMDes Sikayu', logoBase64 ? 36 : 14, headerY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(title, logoBase64 ? 36 : 14, headerY + 6);

      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID')}`, pageWidth - 14, headerY, { align: 'right' });
      doc.text(`Halaman ${data.pageNumber}`, pageWidth - 14, headerY + 6, { align: 'right' });

      doc.setDrawColor(220, 220, 220);
      doc.line(14, 31, pageWidth - 14, 31);
    },
  });

  return Buffer.from(doc.output('arraybuffer'));
}