import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const kolamResult = await sql`
      SELECT jumlah_benih FROM kolam WHERE id = ${id}
    `;
    if (kolamResult.length === 0) {
      return NextResponse.json({ message: 'Kolam tidak ditemukan.' }, { status: 404 });
    }

    const matiResult = await sql`
      SELECT COALESCE(SUM(jumlah_ikan_mati), 0) AS total_mati
      FROM monitoring_pertumbuhan
      WHERE kolam_id = ${id}
    `;

    const jumlahBenih = Number(kolamResult[0].jumlah_benih);
    const totalMati = Number(matiResult[0].total_mati);
    const jumlahHidupSaatIni = jumlahBenih - totalMati;

    return NextResponse.json({ jumlahBenih, totalMati, jumlahHidupSaatIni });
  } catch (error) {
    console.error('Ringkasan kolam error:', error);
    return NextResponse.json({ message: 'Gagal memuat ringkasan.' }, { status: 500 });
  }
}