import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { buildExcel, buildPdf } from '@/lib/monitoring-export-helper';
import { requireLoggedIn } from '@/lib/require-editor';

export async function GET(req: NextRequest) {
  const { error } = await requireLoggedIn();
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'excel'; // 'excel' | 'pdf'

    const rows = await sql`
      SELECT m.tanggal, k.nama_kolam, m.jenis_pakan, m.jumlah_pakan, m.jam_pemberian, m.sisa_pakan
      FROM monitoring_pakan m
      JOIN kolam k ON k.id = m.kolam_id
      ORDER BY m.tanggal ASC
    `;

    const jenisPakanLabel: Record<string, string> = { pelet: 'Pelet', maggot: 'Maggot', azolla: 'Azolla' };
    const headers = ['No', 'Tanggal', 'Kolam', 'Jenis Pakan', 'Jumlah (kg)', 'Jam', 'Sisa (kg)'];
    const body = rows.map((r, idx) => [
      idx + 1,
      new Date(r.tanggal).toLocaleDateString('id-ID'),
      r.nama_kolam,
      jenisPakanLabel[r.jenis_pakan],
      Number(r.jumlah_pakan).toFixed(2),
      r.jam_pemberian || '-',
      r.sisa_pakan ? Number(r.sisa_pakan).toFixed(2) : '-',
    ]);

    if (format === 'excel') {
      const buffer = await buildExcel('Monitoring Pakan', headers, body);
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename="monitoring-pakan.xlsx"',
        },
      });
    }

    const pdfBuffer = buildPdf('Monitoring Pakan', headers, body);
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="monitoring-pakan.pdf"',
      },
    });
  } catch (error) {
    console.error('Export monitoring pakan error:', error);
    return NextResponse.json({ message: 'Gagal export data.' }, { status: 500 });
  }
}