import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    const rows = await sql`
      SELECT id, nama FROM unit_usaha WHERE status = 'Aktif' ORDER BY id
    `;
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Unit usaha aktif error:', error);
    return NextResponse.json({ message: 'Gagal memuat unit usaha.' }, { status: 500 });
  }
}