import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ message: 'Sesi tidak valid.' }, { status: 401 });
    }

    const { status } = await req.json();

    if (!['aktif', 'nonaktif'].includes(status)) {
      return NextResponse.json({ message: 'Status tidak valid.' }, { status: 400 });
    }

    const result = await sql`
      UPDATE users SET status = ${status}, updated_at = now() WHERE id = ${id}
      RETURNING nama
    `;

    if (result.length === 0) {
      return NextResponse.json({ message: 'Akun tidak ditemukan.' }, { status: 404 });
    }

    await sql`
      INSERT INTO log_aktivitas (user_id, aksi, detail)
      VALUES (
        ${session.userId},
        ${status === 'Aktif' ? 'aktifkan_akun' : 'nonaktifkan_akun'},
        ${(status === 'Aktif' ? 'Mengaktifkan' : 'Menonaktifkan') + ' akun "' + result[0].nama + '"'}
      )
    `;

    return NextResponse.json({ message: 'Status berhasil diubah.' });
  } catch (error) {
    console.error('Akun status error:', error);
    return NextResponse.json({ message: 'Gagal mengubah status.' }, { status: 500 });
  }
}