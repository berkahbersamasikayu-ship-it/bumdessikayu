import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { buildExcel, buildPdf } from '@/lib/monitoring-export-helper';
import { requireLoggedIn } from '@/lib/require-editor';

export async function GET(req: NextRequest) {
  const { error } = await requireLoggedIn();
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'excel';

    const rows = await sql`
      SELECT nama_kolam, tanggal_tebar, jumlah_benih, bobot_rata_rata_awal, biomassa_awal
      FROM kolam WHERE status = 'aktif' ORDER BY created_at ASC
    `;

    const headers = ['No', 'Nama Kolam', 'Tanggal Tebar', 'Jumlah Benih', 'Bobot Awal (gram)', 'Biomassa Awal (kg)'];
    const body = rows.map((r, idx) => [
      idx + 1,
      r.nama_kolam,
      new Date(r.tanggal_tebar).toLocaleDateString('id-ID'),
      r.jumlah_benih,
      r.bobot_rata_rata_awal,
      Number(r.biomassa_awal).toFixed(2),
    ]);

    if (format === 'excel') {
      const buffer = await buildExcel('Data Identitas Kolam', headers, body);
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename="identitas-kolam.xlsx"',
        },
      });
    }

    const pdfBuffer = buildPdf('Data Identitas Kolam', headers, body);
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="identitas-kolam.pdf"' },
    });
  } catch (error) {
    console.error('Export kolam error:', error);
    return NextResponse.json({ message: 'Gagal export data.' }, { status: 500 });
  }
}