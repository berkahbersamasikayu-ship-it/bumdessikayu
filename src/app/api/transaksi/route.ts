import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireEditor } from '@/lib/require-editor';

export async function POST(req: NextRequest) {
  try {
    const { error, session } = await requireEditor();
    if (error) return error;
    
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ message: 'Sesi tidak valid, silakan login ulang.' }, { status: 401 });
    }

    const { tanggal, jenis, unitUsahaId, keterangan, nominal, buktiFileUrl } = await req.json();
    const jenisTransaksi = String(jenis);
    const nominalNumber = Number(nominal);

    if (!tanggal || !jenis || !unitUsahaId || !keterangan || !nominal) {
      return NextResponse.json({ message: 'Semua field wajib diisi kecuali bukti.' }, { status: 400 });
    }

    if (!['Pemasukan', 'Pengeluaran'].includes(jenisTransaksi)) {
      return NextResponse.json({ message: 'Jenis transaksi tidak valid.' }, { status: 400 });
    }

    if (!Number.isFinite(nominalNumber) || nominalNumber <= 0) {
      return NextResponse.json({ message: 'Nominal harus lebih dari 0.' }, { status: 400 });
    }

    const transaksiEksisting = await sql`
      SELECT no_transaksi, tanggal, jenis, nominal, created_at
      FROM transaksi
      ORDER BY tanggal ASC, created_at ASC
    `;

    const transaksiSimulasi = [
      ...transaksiEksisting,
      {
        no_transaksi: '__new__',
        tanggal,
        jenis: jenisTransaksi,
        nominal: nominalNumber,
        created_at: new Date(),
      },
    ].sort((a, b) => {
      const tanggalA = new Date(a.tanggal).getTime();
      const tanggalB = new Date(b.tanggal).getTime();
      if (tanggalA !== tanggalB) return tanggalA - tanggalB;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    let saldoSimulasi = 0;
    for (const transaksi of transaksiSimulasi) {
      saldoSimulasi += (transaksi.jenis === 'Pemasukan' || transaksi.jenis === 'saldo_awal')
        ? Number(transaksi.nominal)
        : -Number(transaksi.nominal);

      if (saldoSimulasi < 0) {
        return NextResponse.json({ message: 'Transaksi ini membuat saldo menjadi minus pada urutan buku kas.' }, { status: 400 });
      }
    }

    const result = await sql`
      INSERT INTO transaksi (tanggal, jenis, unit_usaha_id, keterangan, nominal, bukti_file_url, saldosetelahtransaksi, created_by)
      VALUES (${tanggal}, ${jenisTransaksi}, ${unitUsahaId}, ${keterangan}, ${nominalNumber}, ${buktiFileUrl || null}, 0, ${session.userId})
      RETURNING no_transaksi
    `;

    const noTransaksi = result[0].no_transaksi;

    // Menghitung dan mengupdate saldo berjalan untuk semua baris sekaligus
    await sql`
      WITH SaldoBerjalan AS (
        SELECT no_transaksi,
               SUM(CASE WHEN jenis IN ('Pemasukan', 'saldo_awal') THEN nominal ELSE -nominal END) 
               OVER (ORDER BY tanggal ASC, created_at ASC) as saldo_baru
        FROM transaksi
      )
      UPDATE transaksi
      SET saldosetelahtransaksi = SaldoBerjalan.saldo_baru
      FROM SaldoBerjalan
      WHERE transaksi.no_transaksi = SaldoBerjalan.no_transaksi
    `;

    await sql`
      INSERT INTO log_aktivitas (user_id, no_transaksi, aksi, detail)
      VALUES (
        ${session.userId},
        ${noTransaksi},
        'tambah_transaksi',
        ${'Menambahkan ' + noTransaksi + ' (' + keterangan + ', Rp' + nominalNumber.toLocaleString('id-ID') + ')'}
      )
    `;

    return NextResponse.json({ message: 'Transaksi berhasil disimpan.', noTransaksi });
  } catch (error) {
    console.error('Transaksi error:', error);
    return NextResponse.json({ message: 'Gagal menyimpan transaksi.' }, { status: 500 });
  }
}