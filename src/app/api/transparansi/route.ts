// src/app/api/transparansi/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode') || 'bulanan'; 
    const tahun = searchParams.get('tahun') || new Date().getFullYear().toString();

    const now = new Date();
    const bulanBerjalan = now.getMonth() + 1; // 1-12
    const tahunBerjalan = now.getFullYear();

    if (mode === 'bulanan') {
      const rows = await sql`
        SELECT
          EXTRACT(MONTH FROM tanggal) AS bulan,
          EXTRACT(YEAR FROM tanggal) AS tahun,
          COALESCE(SUM(CASE WHEN jenis='Pemasukan' THEN nominal ELSE 0 END), 0) AS pemasukan,
          COALESCE(SUM(CASE WHEN jenis='Pengeluaran' THEN nominal ELSE 0 END), 0) AS pengeluaran
        FROM transaksi
        WHERE EXTRACT(YEAR FROM tanggal) = ${tahun}::int
        GROUP BY EXTRACT(YEAR FROM tanggal), EXTRACT(MONTH FROM tanggal)
        ORDER BY bulan ASC
      `;

      const namaBulan = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
      ];

      const hasil = rows
        .filter((r) => {
          if (Number(r.tahun) === tahunBerjalan && Number(r.bulan) >= bulanBerjalan) {
            return false;
          }
          return true;
        })
        .map((r) => ({
          bulan: Number(r.bulan),
          namaBulan: namaBulan[Number(r.bulan) - 1],
          tahun: Number(r.tahun),
          pemasukan: Number(r.pemasukan),
          pengeluaran: Number(r.pengeluaran),
          saldoBersih: Number(r.pemasukan) - Number(r.pengeluaran),
        }));

      return NextResponse.json({ mode: 'bulanan', tahun: Number(tahun), data: hasil });
    }

    if (mode === 'tahunan') {
      const rows = await sql`
        SELECT
          EXTRACT(YEAR FROM tanggal) AS tahun,
          EXTRACT(MONTH FROM tanggal) AS bulan,
          COALESCE(SUM(CASE WHEN jenis='Pemasukan' THEN nominal ELSE 0 END), 0) AS pemasukan,
          COALESCE(SUM(CASE WHEN jenis='Pengeluaran' THEN nominal ELSE 0 END), 0) AS pengeluaran
        FROM transaksi
        GROUP BY EXTRACT(YEAR FROM tanggal), EXTRACT(MONTH FROM tanggal)
        ORDER BY tahun ASC
      `;

      const filtered = rows.filter((r) => {
        if (Number(r.tahun) === tahunBerjalan && Number(r.bulan) >= bulanBerjalan) {
          return false;
        }
        return true;
      });

      const perTahun: Record<number, { pemasukan: number; pengeluaran: number }> = {};
      filtered.forEach((r) => {
        const th = Number(r.tahun);
        if (!perTahun[th]) perTahun[th] = { pemasukan: 0, pengeluaran: 0 };
        perTahun[th].pemasukan += Number(r.pemasukan);
        perTahun[th].pengeluaran += Number(r.pengeluaran);
      });

      const hasil = Object.entries(perTahun)
        .map(([th, v]) => ({
          tahun: Number(th),
          pemasukan: v.pemasukan,
          pengeluaran: v.pengeluaran,
          saldoBersih: v.pemasukan - v.pengeluaran,
          sedangBerjalan: Number(th) === tahunBerjalan,
        }))
        .sort((a, b) => b.tahun - a.tahun);

      return NextResponse.json({ mode: 'tahunan', data: hasil });
    }

    return NextResponse.json({ message: 'Mode tidak valid.' }, { status: 400 });
  } catch (error) {
    console.error('Transparansi error:', error);
    return NextResponse.json({ message: 'Gagal memuat data transparansi.' }, { status: 500 });
  }
}