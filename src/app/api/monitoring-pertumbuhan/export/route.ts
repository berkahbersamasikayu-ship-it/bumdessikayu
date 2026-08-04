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
      SELECT p.tanggal, k.nama_kolam, p.berat_rata_rata, p.panjang_rata_rata, p.jumlah_ikan_mati, p.biomassa
      FROM monitoring_pertumbuhan p JOIN kolam k ON k.id = p.kolam_id
      ORDER BY p.tanggal ASC
    `;

    const headers = ['No', 'Tanggal', 'Kolam', 'Berat (gram)', 'Panjang (cm)', 'Ikan Mati', 'Biomassa (kg)'];
    const body = rows.map((r, idx) => [
      idx + 1,
      new Date(r.tanggal).toLocaleDateString('id-ID'),
      r.nama_kolam,
      r.berat_rata_rata,
      r.panjang_rata_rata || '-',
      r.jumlah_ikan_mati,
      Number(r.biomassa).toFixed(2),
    ]);

    if (format === 'excel') {
      const buffer = await buildExcel('Monitoring Pertumbuhan', headers, body);
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename="monitoring-pertumbuhan.xlsx"',
        },
      });
    }

    const pdfBuffer = buildPdf('Monitoring Pertumbuhan', headers, body);
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="monitoring-pertumbuhan.pdf"' },
    });
  } catch (error) {
    console.error('Export pertumbuhan error:', error);
    return NextResponse.json({ message: 'Gagal export data.' }, { status: 500 });
  }
}