import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';
import { requireLoggedIn } from '@/lib/require-editor';

export async function GET() {
  try {
    const { error, session } = await requireLoggedIn();
    if (error) return error;

    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ message: 'Sesi tidak valid.' }, { status: 401 });
    }
    
    const rows = await sql`
      SELECT id, nama FROM unit_usaha WHERE status = 'Aktif' ORDER BY id
    `;
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Unit usaha aktif error:', error);
    return NextResponse.json({ message: 'Gagal memuat unit usaha.' }, { status: 500 });
  }
}