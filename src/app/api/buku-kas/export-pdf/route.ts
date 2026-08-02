import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getLogoBase64 } from '@/lib/get-logo-base64';
import { requireLoggedIn } from '@/lib/require-editor';


export async function GET(req: NextRequest) {
  try {
    const { error, session } = await requireLoggedIn();
    if (error) return error;

    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ message: 'Sesi tidak valid.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dateFrom = searchParams.get('dateFrom') || null;
    const dateTo = searchParams.get('dateTo') || null;
    const unitUsahaId = searchParams.get('unitUsahaId') || null;
    const jenis = searchParams.get('jenis') || null;
    const search = searchParams.get('search') || '';

    const rows = await sql`
      SELECT t.no_transaksi, t.tanggal, t.keterangan, t.jenis, t.nominal, t.saldosetelahtransaksi, u.nama AS unit_usaha
      FROM transaksi t
      JOIN unit_usaha u ON u.id = t.unit_usaha_id
      WHERE
        (${dateFrom}::date IS NULL OR t.tanggal >= ${dateFrom}::date)
        AND (${dateTo}::date IS NULL OR t.tanggal <= ${dateTo}::date)
        AND (${unitUsahaId}::integer IS NULL OR t.unit_usaha_id = ${unitUsahaId}::integer)
        AND (${jenis}::text IS NULL OR t.jenis = ${jenis}::jenistransaksi)
        AND (${search} = '' OR t.keterangan ILIKE ${'%' + search + '%'} OR t.no_transaksi ILIKE ${'%' + search + '%'})
      ORDER BY t.tanggal ASC, t.created_at ASC
    `;

    const totalPemasukan = rows.filter((r) => r.jenis === 'Pemasukan').reduce((s, r) => s + Number(r.nominal), 0);
    const totalPengeluaran = rows.filter((r) => r.jenis === 'Pengeluaran').reduce((s, r) => s + Number(r.nominal), 0);
    const saldoPeriode = totalPemasukan - totalPengeluaran;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const logoBase64 = getLogoBase64();

    // Header: logo + nama BUMDes
    let headerY = 15;
    if (logoBase64) {
      doc.addImage(logoBase64, 'JPEG', 14, 10, 18, 18);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0); 
    doc.text('BUMDes Sikayu', logoBase64 ? 36 : 14, headerY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('Laporan Buku Kas', logoBase64 ? 36 : 14, headerY + 6);

    // Info periode & filter di kanan atas
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    const periodeText = dateFrom && dateTo
      ? `Periode: ${new Date(dateFrom).toLocaleDateString('id-ID')} - ${new Date(dateTo).toLocaleDateString('id-ID')}`
      : 'Periode: Semua Data';
    doc.text(periodeText, pageWidth - 14, headerY, { align: 'right' });
    doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID')}`, pageWidth - 14, headerY + 6, { align: 'right' });

    // Garis pemisah
    doc.setDrawColor(220, 220, 220);
    doc.line(14, 32, pageWidth - 14, 32);

    // Ringkasan total di bawah header
    let summaryY = 40;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 58, 138);
    doc.text('Total Pemasukan', 14, summaryY);
    doc.setTextColor(200, 30, 30);
    doc.text('Total Pengeluaran', 80, summaryY);
    doc.setTextColor(20, 120, 60);
    doc.text('Saldo Periode', 146, summaryY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Rp${totalPemasukan.toLocaleString('id-ID')}`, 14, summaryY + 6);
    doc.text(`Rp${totalPengeluaran.toLocaleString('id-ID')}`, 80, summaryY + 6);
    doc.text(`Rp${saldoPeriode.toLocaleString('id-ID')}`, 146, summaryY + 6);

    // Tabel transaksi
    autoTable(doc, {
      startY: summaryY + 14,
      head: [['No', 'Tanggal', 'No. Transaksi', 'Keterangan', 'Unit Usaha', 'Debit', 'Kredit', 'Saldo']],
      body: rows.map((r, idx) => [
        idx + 1,
        new Date(r.tanggal).toLocaleDateString('id-ID'),
        r.no_transaksi,
        r.keterangan,
        r.unit_usaha,
        r.jenis === 'Pemasukan' ? Number(r.nominal).toLocaleString('id-ID') : '-',
        r.jenis === 'Pengeluaran' ? Number(r.nominal).toLocaleString('id-ID') : '-',
        Number(r.saldosetelahtransaksi).toLocaleString('id-ID'),
      ]),
      styles: {
        fontSize: 8,
        cellPadding: 3,
        lineColor: [230, 230, 230],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'left',
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250],
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { halign: 'right' },
      },
      didDrawPage: (data) => {
        // Footer: nomor halaman
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Halaman ${data.pageNumber} dari ${pageCount}`,
          pageWidth - 14,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'right' }
        );
        doc.text(
          'Dokumen dihasilkan otomatis oleh Sistem Keuangan BUMDes Sikayu',
          14,
          doc.internal.pageSize.getHeight() - 10
        );
      },
    });

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="buku-kas.pdf"',
      },
    });
  } catch (error) {
    console.error('Export pdf error:', error);
    return NextResponse.json({ message: 'Gagal export PDF.' }, { status: 500 });
  }
}