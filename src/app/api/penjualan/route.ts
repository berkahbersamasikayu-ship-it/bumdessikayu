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

    const saldoResult = await sql`
      SELECT COALESCE(SUM(CASE WHEN jenis IN ('Pemasukan', 'saldo_awal') THEN nominal ELSE -nominal END), 0) AS saldo
      FROM transaksi
    `;
    const saldoBaru = Number(saldoResult[0].saldo) + totalHarga;

    const unitResult = await sql`SELECT nama FROM unit_usaha WHERE id = ${unitUsahaId}`;
    const namaUnit = unitResult[0]?.nama || 'Unit Usaha';

    const trxResult = await sql`
      INSERT INTO transaksi (tanggal, jenis, unit_usaha_id, keterangan, nominal, saldosetelahtransaksi, created_by)
      VALUES (
        ${tanggal}, 'Pemasukan', ${unitUsahaId},
        ${'Penjualan ' + namaUnit + ' - ' + namaPembeli.trim()},
        ${totalHarga}, ${saldoBaru}, ${session.userId}
      )
      RETURNING no_transaksi
    `;
    const noTransaksi = trxResult[0].no_transaksi;

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