import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';
import { requireLoggedIn } from '@/lib/require-editor';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error, session } = await requireLoggedIn();
    if (error) return error;
    
    const { id } = await params;

    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ message: 'Sesi tidak valid.' }, { status: 401 });
    }

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