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
      SELECT p.id, p.tanggal, p.kolam_id, k.nama_kolam, k.jumlah_benih,
        p.berat_rata_rata, p.panjang_rata_rata, p.jumlah_ikan_mati, p.biomassa
      FROM monitoring_pertumbuhan p
      JOIN kolam k ON k.id = p.kolam_id
      WHERE ${search} = '' OR k.nama_kolam ILIKE ${'%' + search + '%'}
      ORDER BY p.tanggal ASC
    `;

    const kumulatifPerKolam: Record<string, number> = {};
    const hasil = rows.map((r) => {
      const kolamId = r.kolam_id;
      kumulatifPerKolam[kolamId] = (kumulatifPerKolam[kolamId] || 0) + Number(r.jumlah_ikan_mati);
      const jumlahIkanHidup = Number(r.jumlah_benih) - kumulatifPerKolam[kolamId];
      return {
        id: r.id,
        tanggal: r.tanggal,
        namaKolam: r.nama_kolam,
        beratRataRata: Number(r.berat_rata_rata),
        panjangRataRata: r.panjang_rata_rata ? Number(r.panjang_rata_rata) : null,
        jumlahIkanMati: Number(r.jumlah_ikan_mati),
        jumlahIkanHidup,
        biomassa: Number(r.biomassa),
      };
    });

    return NextResponse.json(hasil.reverse());
  } catch (error) {
    console.error('Monitoring pertumbuhan GET error:', error);
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

    const { kolamId, tanggal, beratRataRata, panjangRataRata, jumlahIkanMati } = await req.json();

    if (!kolamId || !tanggal || !beratRataRata) {
      return NextResponse.json({ message: 'Field wajib belum lengkap.' }, { status: 400 });
    }

    const kolamResult = await sql`SELECT jumlah_benih FROM kolam WHERE id = ${kolamId}`;
    if (kolamResult.length === 0) {
      return NextResponse.json({ message: 'Kolam tidak ditemukan.' }, { status: 404 });
    }

    const matiSebelumnyaResult = await sql`
      SELECT COALESCE(SUM(jumlah_ikan_mati), 0) AS total_mati
      FROM monitoring_pertumbuhan
      WHERE kolam_id = ${kolamId}
    `;

    const jumlahBenih = Number(kolamResult[0].jumlah_benih);
    const matiSebelumnya = Number(matiSebelumnyaResult[0].total_mati);
    const matiSekarang = Number(jumlahIkanMati) || 0;
    const jumlahIkanHidupSaatIni = jumlahBenih - matiSebelumnya - matiSekarang;

    if (jumlahIkanHidupSaatIni < 0) {
      return NextResponse.json({ message: 'Jumlah kematian melebihi sisa ikan yang ada.' }, { status: 400 });
    }

    const biomassa = (jumlahIkanHidupSaatIni * Number(beratRataRata)) / 1000;

    await sql`
      INSERT INTO monitoring_pertumbuhan (kolam_id, tanggal, berat_rata_rata, panjang_rata_rata, jumlah_ikan_mati, biomassa, created_by)
      VALUES (${kolamId}, ${tanggal}, ${beratRataRata}, ${panjangRataRata || null}, ${matiSekarang}, ${biomassa}, ${session.userId})
    `;

    await sql`
      INSERT INTO log_aktivitas (user_id, aksi, detail)
      VALUES (${session.userId}, 'tambah_monitoring_pertumbuhan', ${'Mencatat pertumbuhan, biomassa ' + biomassa.toFixed(2) + ' kg (ikan mati: ' + matiSekarang + ' ekor)'})
    `;

    return NextResponse.json({ message: 'Data pertumbuhan berhasil disimpan.' });
  } catch (error) {
    console.error('Monitoring pertumbuhan POST error:', error);
    return NextResponse.json({ message: 'Gagal menyimpan data pertumbuhan.' }, { status: 500 });
  }
}