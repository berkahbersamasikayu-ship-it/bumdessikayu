import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
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

    const { nama, username } = await req.json();

    if (!nama?.trim() || !username?.trim()) {
      return NextResponse.json({ message: 'Nama dan username wajib diisi.' }, { status: 400 });
    }

    const existing = await sql`
      SELECT id FROM users WHERE username = ${username.trim()} AND id != ${id}
    `;
    if (existing.length > 0) {
      return NextResponse.json({ message: 'Username sudah digunakan akun lain.' }, { status: 409 });
    }

    const result = await sql`
      UPDATE users SET nama = ${nama.trim()}, username = ${username.trim()}, updated_at = now()
      WHERE id = ${id}
      RETURNING nama
    `;

    if (result.length === 0) {
      return NextResponse.json({ message: 'Akun tidak ditemukan.' }, { status: 404 });
    }

    await sql`
      INSERT INTO log_aktivitas (user_id, aksi, detail)
      VALUES (${session.userId}, 'edit_akun', ${'Mengubah data akun "' + result[0].nama + '"'})
    `;

    return NextResponse.json({ message: 'Akun berhasil diperbarui.' });
  } catch (error) {
    console.error('Akun PATCH error:', error);
    return NextResponse.json({ message: 'Gagal memperbarui akun.' }, { status: 500 });
  }
}