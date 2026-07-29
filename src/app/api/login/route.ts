// src/app/api/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { message: 'Username dan password wajib diisi.' },
        { status: 400 }
      );
    }

    const result = await sql`
      SELECT id, nama, username, password, status
      FROM users
      WHERE username = ${username}
    `;

    const user = result[0];

    if (!user) {
      return NextResponse.json(
        { message: 'Username atau password salah.' },
        { status: 401 }
      );
    }

    if (user.status === 'Nonaktif') {
      return NextResponse.json(
        { message: 'Akun tidak aktif. Hubungi admin.' },
        { status: 403 }
      );
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return NextResponse.json(
        { message: 'Username atau password salah.' },
        { status: 401 }
      );
    }

    const session = await getSession();
    session.userId = user.id;
    session.nama = user.nama;
    session.username = user.username;
    session.isLoggedIn = true;
    await session.save();

    return NextResponse.json({
      message: 'Login berhasil.',
      user: { id: user.id, nama: user.nama, username: user.username },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan server.' },
      { status: 500 }
    );
  }
}