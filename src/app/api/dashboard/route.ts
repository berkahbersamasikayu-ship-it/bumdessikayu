import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';
import { requireLoggedIn } from '@/lib/require-editor';

export async function GET() {
  try {
    const { error, session } = await requireLoggedIn();
    if (error) return error;
    const userName = session.nama || 'Admin BUMDes';

    const saldoKasResult = await sql`
      SELECT COALESCE(SUM(CASE WHEN jenis='Pemasukan' THEN nominal ELSE -nominal END), 0) AS saldo
      FROM transaksi
    `;

    const bulanIniResult = await sql`
      SELECT
        COALESCE(SUM(CASE WHEN jenis='Pemasukan' THEN nominal ELSE 0 END), 0) AS pemasukan,
        COALESCE(SUM(CASE WHEN jenis='Pengeluaran' THEN nominal ELSE 0 END), 0) AS pengeluaran,
        COUNT(*) AS jumlah
      FROM transaksi
      WHERE date_trunc('month', tanggal) = date_trunc('month', CURRENT_DATE)
    `;

    const saldoPerUnitResult = await sql`
      SELECT u.nama,
        COALESCE(SUM(CASE WHEN t.jenis='Pemasukan' THEN t.nominal ELSE -t.nominal END), 0) AS saldo
      FROM unit_usaha u
      LEFT JOIN transaksi t ON t.unit_usaha_id = u.id
      WHERE u.status = 'Aktif'
      GROUP BY u.id, u.nama
      ORDER BY u.id
    `;

    const grafikResult = await sql`
      SELECT
        to_char(tanggal, 'Mon YYYY') AS bulan,
        SUM(CASE WHEN jenis='Pemasukan' THEN nominal ELSE 0 END) AS pemasukan,
        SUM(CASE WHEN jenis='Pengeluaran' THEN nominal ELSE 0 END) AS pengeluaran
      FROM transaksi
      WHERE tanggal >= (CURRENT_DATE - INTERVAL '6 months')
      GROUP BY date_trunc('month', tanggal), to_char(tanggal, 'Mon YYYY')
      ORDER BY date_trunc('month', tanggal)
    `;

    const transaksiTerakhirResult = await sql`
      SELECT keterangan, tanggal, nominal, jenis
      FROM transaksi
      ORDER BY tanggal DESC
      LIMIT 5
    `;

    return NextResponse.json({
      userName,
      saldoKas: Number(saldoKasResult[0].saldo),
      pemasukanBulanIni: Number(bulanIniResult[0].pemasukan),
      pengeluaranBulanIni: Number(bulanIniResult[0].pengeluaran),
      jumlahTransaksi: Number(bulanIniResult[0].jumlah),
      saldoPerUnit: saldoPerUnitResult.map((r) => ({
        nama: r.nama,
        saldo: Number(r.saldo),
      })),
      grafikBulanan: grafikResult.map((r) => ({
        bulan: r.bulan,
        pemasukan: Number(r.pemasukan),
        pengeluaran: Number(r.pengeluaran),
      })),
      transaksiTerakhir: transaksiTerakhirResult.map((r) => ({
        keterangan: r.keterangan,
        tanggal: new Date(r.tanggal).toLocaleDateString('id-ID'),
        nominal: Number(r.nominal),
        jenis: r.jenis,
      })),
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ message: 'Gagal memuat data dashboard.' }, { status: 500 });
  }
}