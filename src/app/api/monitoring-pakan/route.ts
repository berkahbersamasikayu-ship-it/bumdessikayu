import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ message: 'Sesi tidak valid.' }, { status: 401 });
    }
    
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';

    const rows = await sql`
      SELECT m.id, m.tanggal, m.jam_pemberian, k.nama_kolam, m.jenis_pakan, m.jumlah_pakan,
        m.sisa_pakan
      FROM monitoring_pakan m
      JOIN kolam k ON k.id = m.kolam_id
      WHERE
        ${search} = '' OR
        k.nama_kolam ILIKE ${'%' + search + '%'} OR
        m.jenis_pakan::text ILIKE ${'%' + search + '%'} 
      ORDER BY m.tanggal DESC, m.jam_pemberian DESC
    `;
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Monitoring pakan GET error:', error);
    return NextResponse.json({ message: 'Gagal memuat data.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ message: 'Sesi tidak valid.' }, { status: 401 });
    }

    const { kolamId, tanggal, jenisPakan, jumlahPakan, jamPemberian, sisaPakan } = await req.json();

    if (!kolamId || !tanggal || !jenisPakan || !jumlahPakan) {
      return NextResponse.json({ message: 'Field wajib belum lengkap.' }, { status: 400 });
    }

    await sql`
      INSERT INTO monitoring_pakan (kolam_id, tanggal, jam_pemberian, jenis_pakan, jumlah_pakan, sisa_pakan, created_by)
      VALUES (${kolamId}, ${tanggal}, ${jamPemberian || null}, ${jenisPakan}, ${jumlahPakan}, ${sisaPakan || 0}, ${session.userId})
    `;

    await sql`
      INSERT INTO log_aktivitas (user_id, aksi, detail)
      VALUES (${session.userId}, 'tambah_monitoring_pakan', ${'Mencatat pemberian pakan ' + jenisPakan + ' ' + jumlahPakan + ' kg'})
    `;

    return NextResponse.json({ message: 'Data pakan berhasil disimpan.' });
  } catch (error) {
    console.error('Monitoring pakan POST error:', error);
    return NextResponse.json({ message: 'Gagal menyimpan data pakan.' }, { status: 500 });
  }
}