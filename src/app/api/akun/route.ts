import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { requireEditor, requireLoggedIn } from '@/lib/require-editor';

export async function GET() {
  try {
    const { error, session } = await requireLoggedIn();
    if (error) return error;
    
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ message: 'Sesi tidak valid.' }, { status: 401 });
    }

    // [TAMBAHAN]: Memasukkan kolom 'role' ke dalam query SELECT
    const rows = await sql`
      SELECT id, nama, username, status, role, created_at
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

    // [TAMBAHAN]: Mengambil 'role' dari body request
    const { nama, username, password, role } = await req.json();

    // [TAMBAHAN]: Validasi memastikan 'role' tidak kosong
    if (!nama?.trim() || !username?.trim() || !password || !role?.trim()) {
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

    // [PERBAIKAN]: Menambahkan ${role.trim()} ke dalam urutan VALUES
    const result = await sql`
      INSERT INTO users (nama, username, password, status, role)
      VALUES (${nama.trim()}, ${username.trim()}, ${passwordHash}, 'Aktif', ${role.trim()})
      RETURNING id, nama
    `;

    await sql`
      INSERT INTO log_aktivitas (user_id, aksi, detail)
      VALUES (${session.userId}, 'tambah_akun', ${'Menambahkan akun "' + result[0].nama + '" (' + username.trim() + ') dengan role ' + role.trim()})
    `;

    return NextResponse.json({ message: 'Akun berhasil ditambahkan.' });
  } catch (error) {
    console.error('Akun POST error:', error);
    return NextResponse.json({ message: 'Gagal menambahkan akun.' }, { status: 500 });
  }
}