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
      SELECT id, tanggal, kondisi_gh, irigasi_tetes, kondisi_tanaman, hama_penyakit,
        pemupukan, pembungaan_pembuahan, tindakan
      FROM monitoring_greenhouse
      WHERE ${search} = '' OR tindakan ILIKE ${'%' + search + '%'}
      ORDER BY tanggal DESC, created_at DESC
    `;
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Monitoring GH GET error:', error);
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

    const {
      tanggal, kondisiGh, irigasiTetes, kondisiTanaman,
      hamaPenyakit, pemupukan, pembungaanPembuahan, tindakan,
    } = await req.json();

    if (!tanggal || !kondisiGh || !irigasiTetes || !kondisiTanaman || !hamaPenyakit || !pemupukan || !pembungaanPembuahan) {
      return NextResponse.json({ message: 'Semua field wajib diisi kecuali tindakan.' }, { status: 400 });
    }

    await sql`
      INSERT INTO monitoring_greenhouse
        (tanggal, kondisi_gh, irigasi_tetes, kondisi_tanaman, hama_penyakit, pemupukan, pembungaan_pembuahan, tindakan, created_by)
      VALUES
        (${tanggal}, ${kondisiGh}, ${irigasiTetes}, ${kondisiTanaman}, ${hamaPenyakit}, ${pemupukan}, ${pembungaanPembuahan}, ${tindakan || null}, ${session.userId})
    `;

    await sql`
      INSERT INTO log_aktivitas (user_id, aksi, detail)
      VALUES (${session.userId}, 'tambah_monitoring_greenhouse', ${'Mencatat monitoring greenhouse tanggal ' + tanggal})
    `;

    return NextResponse.json({ message: 'Data monitoring greenhouse berhasil disimpan.' });
  } catch (error) {
    console.error('Monitoring GH POST error:', error);
    return NextResponse.json({ message: 'Gagal menyimpan data.' }, { status: 500 });
  }
}