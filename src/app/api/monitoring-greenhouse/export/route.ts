import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { buildExcel, buildPdf } from '@/lib/monitoring-export-helper';
import { requireLoggedIn } from '@/lib/require-editor';

const labelMap: Record<string, string> = {
  baik: 'Baik', perlu_dibersihkan: 'Perlu Dibersihkan', normal: 'Normal', bocor: 'Bocor', tersumbat: 'Tersumbat',
  sehat: 'Sehat', layu: 'Layu', mati: 'Mati', tidak_ada: 'Tidak Ada', ada: 'Ada',
  sudah: 'Sudah', belum: 'Belum', berbunga: 'Berbunga', berbuah: 'Berbuah',
};

export async function GET(req: NextRequest) {
  const { error } = await requireLoggedIn();
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'excel';

    const rows = await sql`
      SELECT tanggal, kondisi_gh, irigasi_tetes, kondisi_tanaman, hama_penyakit, pemupukan, pembungaan_pembuahan, tindakan
      FROM monitoring_greenhouse ORDER BY tanggal ASC
    `;

    const headers = ['No', 'Tanggal', 'Kondisi GH', 'Irigasi Tetes', 'Kondisi Tanaman', 'Hama/Penyakit', 'Pemupukan', 'Pembungaan/Pembuahan', 'Tindakan'];
    const body = rows.map((r, idx) => [
      idx + 1,
      new Date(r.tanggal).toLocaleDateString('id-ID'),
      labelMap[r.kondisi_gh], labelMap[r.irigasi_tetes], labelMap[r.kondisi_tanaman],
      labelMap[r.hama_penyakit], labelMap[r.pemupukan], labelMap[r.pembungaan_pembuahan],
      r.tindakan || '-',
    ]);

    if (format === 'excel') {
      const buffer = await buildExcel('Monitoring Greenhouse', headers, body);
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename="monitoring-greenhouse.xlsx"',
        },
      });
    }

    const pdfBuffer = buildPdf('Monitoring Greenhouse', headers, body);
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="monitoring-greenhouse.pdf"' },
    });
  } catch (error) {
    console.error('Export greenhouse error:', error);
    return NextResponse.json({ message: 'Gagal export data.' }, { status: 500 });
  }
}