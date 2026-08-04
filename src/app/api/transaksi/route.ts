import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';
import { requireEditor } from '@/lib/require-editor';

export async function POST(req: NextRequest) {
  try {
    const { error, session } = await requireEditor();
    if (error) return error;
    
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ message: 'Sesi tidak valid, silakan login ulang.' }, { status: 401 });
    }

    const { tanggal, jenis, unitUsahaId, keterangan, nominal, buktiFileUrl } = await req.json();
    const nominalNumber = Number(nominal);

    if (!tanggal || !jenis || !unitUsahaId || !keterangan || !nominal) {
      return NextResponse.json({ message: 'Semua field wajib diisi kecuali bukti.' }, { status: 400 });
    }

    if (!Number.isFinite(nominalNumber) || nominalNumber <= 0) {
      return NextResponse.json({ message: 'Nominal harus lebih dari 0.' }, { status: 400 });
    }

    // Hitung saldo berjalan
    const saldoResult = await sql`
      SELECT COALESCE(SUM(CASE WHEN jenis IN ('Pemasukan', 'saldo_awal') THEN nominal ELSE -nominal END), 0) AS saldo
      FROM transaksi
    `;
    const saldoSekarang = Number(saldoResult[0].saldo);
    const saldoBaru = jenis === 'Pemasukan' ? saldoSekarang + nominalNumber : saldoSekarang - nominalNumber;

    if (saldoBaru < 0) {
      return NextResponse.json({ message: 'Saldo tidak cukup. Transaksi pengeluaran tidak boleh membuat saldo menjadi minus.' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO transaksi (tanggal, jenis, unit_usaha_id, keterangan, nominal, bukti_file_url, saldosetelahtransaksi, created_by)
      VALUES (${tanggal}, ${jenis}, ${unitUsahaId}, ${keterangan}, ${nominalNumber}, ${buktiFileUrl || null}, ${saldoBaru}, ${session.userId})
      RETURNING no_transaksi
    `;

    const noTransaksi = result[0].no_transaksi;

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