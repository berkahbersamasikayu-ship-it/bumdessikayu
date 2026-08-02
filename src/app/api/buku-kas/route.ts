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
    const dateFrom = searchParams.get('dateFrom') || null;
    const dateTo = searchParams.get('dateTo') || null;
    const unitUsahaId = searchParams.get('unitUsahaId') || null;
    const jenis = searchParams.get('jenis') || null;
    const search = searchParams.get('search') || '';

    const rows = await sql`
      SELECT
        t.no_transaksi,
        t.tanggal,
        t.keterangan,
        t.jenis,
        t.nominal,
        t.saldosetelahtransaksi,
        t.bukti_file_url,
        u.nama AS unit_usaha
      FROM transaksi t
      JOIN unit_usaha u ON u.id = t.unit_usaha_id
      WHERE
        (${dateFrom}::date IS NULL OR t.tanggal >= ${dateFrom}::date)
        AND (${dateTo}::date IS NULL OR t.tanggal <= ${dateTo}::date)
        AND (${unitUsahaId}::integer IS NULL OR t.unit_usaha_id = ${unitUsahaId}::integer)
        AND (${jenis}::text IS NULL OR t.jenis = ${jenis}::jenistransaksi)
        AND (
          ${search} = '' OR
          t.keterangan ILIKE ${'%' + search + '%'} OR
          t.no_transaksi ILIKE ${'%' + search + '%'}
        )
      ORDER BY t.tanggal ASC, t.no_transaksi ASC
    `;

    const totalPemasukan = rows
      .filter((r) => r.jenis === 'Pemasukan')
      .reduce((sum, r) => sum + Number(r.nominal), 0);

    const totalPengeluaran = rows
      .filter((r) => r.jenis === 'Pengeluaran')
      .reduce((sum, r) => sum + Number(r.nominal), 0);

    const saldoPeriode = totalPemasukan - totalPengeluaran;

    return NextResponse.json({
      totalPemasukan,
      totalPengeluaran,
      saldoPeriode,
      transaksi: rows.map((r) => ({
        noTransaksi: r.no_transaksi,
        tanggal: new Date(r.tanggal).toLocaleDateString('id-ID'),
        keterangan: r.keterangan,
        unitUsaha: r.unit_usaha,
        jenis: r.jenis,
        nominal: Number(r.nominal),
        saldoSetelah: Number(r.saldosetelahtransaksi),
        buktiFileUrl: r.bukti_file_url,
      })),
    });
  } catch (error) {
    console.error('Buku kas error:', error);
    return NextResponse.json({ message: 'Gagal memuat data buku kas.' }, { status: 500 });
  }
}