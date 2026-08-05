import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireLoggedIn } from '@/lib/require-editor';

export async function GET() {
  const { error } = await requireLoggedIn();
  if (error) return error;

  try {
    const rows = await sql`
      SELECT DISTINCT ON (nama_kolam) id, nama_kolam, tanggal_tebar
      FROM kolam
      WHERE status = 'Aktif'
      ORDER BY nama_kolam, tanggal_tebar DESC
    `;

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Kolam dropdown error:', error);
    return NextResponse.json({ message: 'Gagal memuat daftar kolam.' }, { status: 500 });
  }
}