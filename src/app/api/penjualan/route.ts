import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireEditor, requireLoggedIn } from '@/lib/require-editor';

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
    const search = searchParams.get('search') || '';

    const rows = await sql`
      SELECT p.id, p.tanggal, p.nama_pembeli, p.keterangan, p.kuantitas, p.harga_per_kg, p.total_harga,
        u.nama AS unit_usaha
      FROM penjualan p
      JOIN unit_usaha u ON u.id = p.unit_usaha_id
      WHERE
        (${dateFrom}::date IS NULL OR p.tanggal >= ${dateFrom}::date)
        AND (${dateTo}::date IS NULL OR p.tanggal <= ${dateTo}::date)
        AND (${unitUsahaId}::integer IS NULL OR p.unit_usaha_id = ${unitUsahaId}::integer)
        AND (
          ${search} = '' OR
          p.nama_pembeli ILIKE ${'%' + search + '%'} OR
          p.keterangan ILIKE ${'%' + search + '%'} OR
          u.nama ILIKE ${'%' + search + '%'}
        )
      ORDER BY p.tanggal DESC
    `;

    return NextResponse.json(
      rows.map((r) => ({
        id: r.id,
        tanggal: new Date(r.tanggal).toLocaleDateString('id-ID'),
        namaPembeli: r.nama_pembeli,
        keterangan: r.keterangan,
        unitUsaha: r.unit_usaha,
        kuantitas: Number(r.kuantitas),
        hargaPerKg: Number(r.harga_per_kg),
        totalHarga: Number(r.total_harga),
      }))
    );
  } catch (error) {
    console.error('Penjualan GET error:', error);
    return NextResponse.json({ message: 'Gagal memuat data penjualan.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { error, session } = await requireEditor();
    if (error) return error;
    
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ message: 'Sesi tidak valid, silakan login ulang.' }, { status: 401 });
    }

    const { tanggal, unitUsahaId, namaPembeli, keterangan, kuantitas, hargaPerKg } = await req.json();

    if (!tanggal || !unitUsahaId || !namaPembeli?.trim() || !kuantitas || !hargaPerKg) {
      return NextResponse.json({ message: 'Semua field wajib diisi kecuali keterangan.' }, { status: 400 });
    }

    if (Number(kuantitas) <= 0 || Number(hargaPerKg) <= 0) {
      return NextResponse.json({ message: 'Kuantitas dan harga per kg harus lebih dari 0.' }, { status: 400 });
    }

    const totalHarga = Number(kuantitas) * Number(hargaPerKg);

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
        jenis: 'Pemasukan',
        nominal: totalHarga,
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
        return NextResponse.json({ message: 'Penjualan ini membuat saldo menjadi minus pada urutan buku kas.' }, { status: 400 });
      }
    }

    const unitResult = await sql`SELECT nama FROM unit_usaha WHERE id = ${unitUsahaId}`;
    const namaUnit = unitResult[0]?.nama || 'Unit Usaha';

    const trxResult = await sql`
      INSERT INTO transaksi (tanggal, jenis, unit_usaha_id, keterangan, nominal, saldosetelahtransaksi, created_by)
      VALUES (
        ${tanggal}, 'Pemasukan', ${unitUsahaId},
        ${'Penjualan ' + namaUnit + ' - ' + namaPembeli.trim()},
        ${totalHarga}, 0, ${session.userId}
      )
      RETURNING no_transaksi
    `;
    const noTransaksi = trxResult[0].no_transaksi;

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
      INSERT INTO penjualan (tanggal, unit_usaha_id, nama_pembeli, keterangan, kuantitas, harga_per_kg, total_harga, no_transaksi, created_by)
      VALUES (
        ${tanggal}, ${unitUsahaId}, ${namaPembeli.trim()}, ${keterangan || null},
        ${kuantitas}, ${hargaPerKg}, ${totalHarga}, ${noTransaksi}, ${session.userId}
      )
    `;

    await sql`
      INSERT INTO log_aktivitas (user_id, no_transaksi, aksi, detail)
      VALUES (
        ${session.userId}, ${noTransaksi}, 'tambah_penjualan',
        ${'Menambahkan penjualan ' + namaUnit + ' ke ' + namaPembeli.trim() + ' (Rp' + totalHarga.toLocaleString('id-ID') + '), otomatis tercatat sebagai ' + noTransaksi}
      )
    `;

    return NextResponse.json({ message: 'Data penjualan berhasil disimpan.', noTransaksi });
  } catch (error) {
    console.error('Penjualan POST error:', error);
    return NextResponse.json({ message: 'Gagal menyimpan data penjualan.' }, { status: 500 });
  }
}