// src/app/api/unit-usaha/route.ts
import { NextRequest, NextResponse } from 'next/server';
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
      SELECT
        u.id,
        u.nama,
        u.status,
        COALESCE(SUM(CASE WHEN t.jenis='Pemasukan' THEN t.nominal ELSE -t.nominal END), 0) AS saldo
      FROM unit_usaha u
      LEFT JOIN transaksi t ON t.unit_usaha_id = u.id
      GROUP BY u.id, u.nama, u.status
      ORDER BY u.id ASC
    `;

    return NextResponse.json(
      rows.map((r) => ({
        id: r.id,
        nama: r.nama,
        status: r.status,
        saldo: Number(r.saldo),
      }))
    );
  } catch (error) {
    console.error('Unit usaha GET error:', error);
    return NextResponse.json({ message: 'Gagal memuat data unit usaha.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ message: 'Sesi tidak valid.' }, { status: 401 });
    }

    const { nama } = await req.json();

    if (!nama || !nama.trim()) {
      return NextResponse.json({ message: 'Nama unit usaha wajib diisi.' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO unit_usaha (nama, status)
      VALUES (${nama.trim()}, ${'Aktif'})
      RETURNING id, nama
    `;

    await sql`
      INSERT INTO log_aktivitas (user_id, aksi, detail)
      VALUES (${session.userId}, 'tambah_unit_usaha', ${'Menambahkan unit usaha "' + result[0].nama + '"'})
    `;

    return NextResponse.json({ message: 'Unit usaha berhasil ditambahkan.', id: result[0].id });
  } catch (error) {
    console.error('Unit usaha POST error:', error);
    return NextResponse.json({ message: 'Gagal menambahkan unit usaha.' }, { status: 500 });
  }
}