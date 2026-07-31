import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

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