import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';
import { requireEditor } from '@/lib/require-editor';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error, session } = await requireEditor();
    if (error) return error;
    const { id } = await params;
    
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ message: 'Sesi tidak valid.' }, { status: 401 });
    }

    const { password } = await req.json();

    if (!password || password.length < 6) {
      return NextResponse.json({ message: 'Password minimal 6 karakter.' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await sql`
      UPDATE users SET password = ${passwordHash}, updated_at = now() WHERE id = ${id}
      RETURNING nama
    `;

    if (result.length === 0) {
      return NextResponse.json({ message: 'Akun tidak ditemukan.' }, { status: 404 });
    }

    await sql`
      INSERT INTO log_aktivitas (user_id, aksi, detail)
      VALUES (${session.userId}, 'reset_password', ${'Mereset password akun "' + result[0].nama + '"'})
    `;

    return NextResponse.json({ message: 'Password berhasil direset.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ message: 'Gagal mereset password.' }, { status: 500 });
  }
}