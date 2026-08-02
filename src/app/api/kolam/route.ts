import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';
import { requireLoggedIn } from '@/lib/require-editor';

export async function GET(req: NextRequest) {
  try {
    const { error, session } = await requireLoggedIn();
    if (error) return error;
    
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ message: 'Sesi tidak valid.' }, { status: 401 });
    }
    
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';

    const rows = await sql`
      SELECT id, nama_kolam, luas_kolam, tanggal_tebar, jumlah_benih,
        bobot_rata_rata_awal, biomassa_awal, status
      FROM kolam
      WHERE status = 'Aktif' AND nama_kolam ILIKE ${'%' + search + '%'}
      ORDER BY id ASC
    `;
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Kolam GET error:', error);
    return NextResponse.json({ message: 'Gagal memuat data kolam.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ message: 'Sesi tidak valid.' }, { status: 401 });
    }

    const { namaKolam, luasKolam, tanggalTebar, jumlahBenih, bobotRataRataAwal } = await req.json();

    if (!namaKolam || !tanggalTebar || !jumlahBenih || !bobotRataRataAwal) {
      return NextResponse.json({ message: 'Field wajib belum lengkap.' }, { status: 400 });
    }

    const biomassaAwal = (Number(jumlahBenih) * Number(bobotRataRataAwal)) / 1000;

    const result = await sql`
      INSERT INTO kolam (nama_kolam, luas_kolam, tanggal_tebar, jumlah_benih, bobot_rata_rata_awal, biomassa_awal, created_by)
      VALUES (${namaKolam}, ${luasKolam || null}, ${tanggalTebar}, ${jumlahBenih}, ${bobotRataRataAwal}, ${biomassaAwal}, ${session.userId})
      RETURNING nama_kolam
    `;

    await sql`
      INSERT INTO log_aktivitas (user_id, aksi, detail)
      VALUES (${session.userId}, 'tambah_kolam', ${'Menambahkan data identitas kolam "' + result[0].nama_kolam + '"'})
    `;

    return NextResponse.json({ message: 'Data kolam berhasil disimpan.' });
  } catch (error) {
    console.error('Kolam POST error:', error);
    return NextResponse.json({ message: 'Gagal menyimpan data kolam.' }, { status: 500 });
  }
}