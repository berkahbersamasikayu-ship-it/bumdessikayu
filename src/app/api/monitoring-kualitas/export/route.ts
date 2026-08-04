// src/app/api/monitoring-kualitas/export/route.ts
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
      SELECT q.tanggal, k.nama_kolam, q.suhu_air, q.ph, q.do_level, q.amonia, q.kondisi_ikan, q.nafsu_makan
      FROM monitoring_kualitas q JOIN kolam k ON k.id = q.kolam_id
      ORDER BY q.tanggal ASC
    `;

    const headers = ['No', 'Tanggal', 'Kolam', 'Suhu Air', 'pH', 'DO', 'Amonia', 'Kondisi Ikan', 'Nafsu Makan'];
    const body = rows.map((r, idx) => [
      idx + 1,
      new Date(r.tanggal).toLocaleDateString('id-ID'),
      r.nama_kolam,
      r.suhu_air ?? '-',
      r.ph ?? '-',
      r.do_level ?? '-',
      r.amonia ?? '-',
      r.kondisi_ikan || '-',
      r.nafsu_makan || '-',
    ]);

    if (format === 'excel') {
      const buffer = await buildExcel('Monitoring Kualitas Budidaya', headers, body);
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename="monitoring-kualitas.xlsx"',
        },
      });
    }

    const pdfBuffer = buildPdf('Monitoring Kualitas Budidaya', headers, body);
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="monitoring-kualitas.pdf"' },
    });
  } catch (error) {
    console.error('Export kualitas error:', error);
    return NextResponse.json({ message: 'Gagal export data.' }, { status: 500 });
  }
}