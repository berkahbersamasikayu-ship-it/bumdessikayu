import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';
import { requireEditor, requireLoggedIn } from '@/lib/require-editor';

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
      SELECT q.id, q.tanggal, k.nama_kolam, q.suhu_air, q.ph, q.do_level, q.amonia, q.kondisi_ikan, q.nafsu_makan
      FROM monitoring_kualitas q
      JOIN kolam k ON k.id = q.kolam_id
      WHERE
        ${search} = '' OR
        k.nama_kolam ILIKE ${'%' + search + '%'} OR
        q.kondisi_ikan ILIKE ${'%' + search + '%'} OR
        q.nafsu_makan ILIKE ${'%' + search + '%'}
      ORDER BY q.tanggal DESC
    `;
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Monitoring kualitas GET error:', error);
    return NextResponse.json({ message: 'Gagal memuat data.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { error, session } = await requireEditor();
    if (error) return error;
    
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ message: 'Sesi tidak valid.' }, { status: 401 });
    }

    const { kolamId, tanggal, suhuAir, ph, doLevel, amonia, kondisiIkan, nafsuMakan } = await req.json();

    if (!kolamId || !tanggal) {
      return NextResponse.json({ message: 'Field wajib belum lengkap.' }, { status: 400 });
    }

    await sql`
      INSERT INTO monitoring_kualitas (kolam_id, tanggal, suhu_air, ph, do_level, amonia, kondisi_ikan, nafsu_makan, created_by)
      VALUES (${kolamId}, ${tanggal}, ${suhuAir || null}, ${ph || null}, ${doLevel || null}, ${amonia || null}, ${kondisiIkan || null}, ${nafsuMakan || null}, ${session.userId})
    `;

    await sql`
      INSERT INTO log_aktivitas (user_id, aksi, detail)
      VALUES (${session.userId}, 'tambah_monitoring_kualitas', 'Mencatat monitoring kualitas budidaya')
    `;

    return NextResponse.json({ message: 'Data kualitas berhasil disimpan.' });
  } catch (error) {
    console.error('Monitoring kualitas POST error:', error);
    return NextResponse.json({ message: 'Gagal menyimpan data kualitas.' }, { status: 500 });
  }
}