import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import ExcelJS from 'exceljs';

export async function GET(req: NextRequest) {
  try {
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
      ORDER BY t.tanggal ASC, t.no_transaksi ASC
    `;

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Buku Kas');

    sheet.columns = [
      { header: 'No', key: 'no', width: 6 },
      { header: 'Tanggal', key: 'tanggal', width: 14 },
      { header: 'No. Transaksi', key: 'noTransaksi', width: 20 },
      { header: 'Keterangan', key: 'keterangan', width: 30 },
      { header: 'Unit Usaha', key: 'unitUsaha', width: 16 },
      { header: 'Debit', key: 'debit', width: 16 },
      { header: 'Kredit', key: 'kredit', width: 16 },
      { header: 'Saldo', key: 'saldo', width: 16 },
    ];

    sheet.getRow(1).font = { bold: true };

    rows.forEach((r, idx) => {
      sheet.addRow({
        no: idx + 1,
        tanggal: new Date(r.tanggal).toLocaleDateString('id-ID'),
        noTransaksi: r.no_transaksi,
        keterangan: r.keterangan,
        unitUsaha: r.unit_usaha,
        debit: r.jenis === 'Pemasukan' ? Number(r.nominal) : 0,
        kredit: r.jenis === 'Pengeluaran' ? Number(r.nominal) : 0,
        saldo: Number(r.saldosetelahtransaksi),
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="buku-kas.xlsx"',
      },
    });
  } catch (error) {
    console.error('Export excel error:', error);
    return NextResponse.json({ message: 'Gagal export Excel.' }, { status: 500 });
  }
}