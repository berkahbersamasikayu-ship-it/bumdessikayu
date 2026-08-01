import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';
import { requireEditor } from '@/lib/require-editor';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ message: 'Sesi tidak valid.' }, { status: 401 });
    }

    const rows = await sql`
      SELECT id, nama, username, status, created_at
      FROM users
      ORDER BY nama ASC
    `;
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Akun GET error:', error);
    return NextResponse.json({ message: 'Gagal memuat data akun.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { error, session } = await requireEditor();
    if (error) return error;
    
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ message: 'Sesi tidak valid.' }, { status: 401 });
    }

    const { nama, username, password } = await req.json();

    if (!nama?.trim() || !username?.trim() || !password) {
      return NextResponse.json({ message: 'Semua field wajib diisi.' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ message: 'Password minimal 6 karakter.' }, { status: 400 });
    }

    const existing = await sql`SELECT id FROM users WHERE username = ${username.trim()}`;
    if (existing.length > 0) {
      return NextResponse.json({ message: 'Username sudah digunakan.' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await sql`
      INSERT INTO users (nama, username, password, status)
      VALUES (${nama.trim()}, ${username.trim()}, ${passwordHash}, 'Aktif')
      RETURNING id, nama
    `;

    await sql`
      INSERT INTO log_aktivitas (user_id, aksi, detail)
      VALUES (${session.userId}, 'tambah_akun', ${'Menambahkan akun "' + result[0].nama + '" (' + username.trim() + ')'})
    `;

    return NextResponse.json({ message: 'Akun berhasil ditambahkan.' });
  } catch (error) {
    console.error('Akun POST error:', error);
    return NextResponse.json({ message: 'Gagal menambahkan akun.' }, { status: 500 });
  }
}