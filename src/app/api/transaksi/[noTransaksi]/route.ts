import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';

export async function GET(req: NextRequest, { params }: { params: Promise<{ noTransaksi: string }> }) {
  try {
    const { noTransaksi } = await params;

    const result = await sql`
      SELECT no_transaksi, tanggal, jenis, unit_usaha_id, keterangan, nominal, bukti_file_url
      FROM transaksi
      WHERE no_transaksi = ${noTransaksi}
    `;

    if (result.length === 0) {
      return NextResponse.json({ message: 'Transaksi tidak ditemukan.' }, { status: 404 });
    }

    const t = result[0];
    return NextResponse.json({
      noTransaksi: t.no_transaksi,
      tanggal: t.tanggal.toISOString().split('T')[0],
      jenis: t.jenis,
      unitUsahaId: t.unit_usaha_id,
      keterangan: t.keterangan,
      nominal: Number(t.nominal),
      buktiFileUrl: t.bukti_file_url,
    });
  } catch (error) {
    console.error('Get transaksi error:', error);
    return NextResponse.json({ message: 'Gagal memuat data transaksi.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ noTransaksi: string }> }) {
  try {
    const { noTransaksi } = await params;
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ message: 'Sesi tidak valid.' }, { status: 401 });
    }

    const { tanggal, jenis, unitUsahaId, keterangan, nominal, buktiFileUrl } = await req.json();

    if (!tanggal || !jenis || !unitUsahaId || !keterangan || !nominal) {
      return NextResponse.json({ message: 'Semua field wajib diisi kecuali bukti.' }, { status: 400 });
    }

    if (Number(nominal) <= 0) {
      return NextResponse.json({ message: 'Nominal harus lebih dari 0.' }, { status: 400 });
    }

    const oldResult = await sql`
      SELECT tanggal, jenis, keterangan, nominal FROM transaksi WHERE no_transaksi = ${noTransaksi}
    `;
    if (oldResult.length === 0) {
      return NextResponse.json({ message: 'Transaksi tidak ditemukan.' }, { status: 404 });
    }
    const old = oldResult[0];

    await sql`
      UPDATE transaksi
      SET tanggal = ${tanggal}, jenis = ${jenis}, unit_usaha_id = ${unitUsahaId},
          keterangan = ${keterangan}, nominal = ${nominal},
          bukti_file_url = ${buktiFileUrl !== undefined ? buktiFileUrl : sql`bukti_file_url`},
          updated_at = now()
      WHERE no_transaksi = ${noTransaksi}
    `;

    const semuaTransaksi = await sql`
      SELECT no_transaksi, jenis, nominal
      FROM transaksi
      ORDER BY tanggal ASC, created_at ASC
    `;

    let saldoBerjalan = 0;
    for (const t of semuaTransaksi) {
      saldoBerjalan += t.jenis === 'Pemasukan' ? Number(t.nominal) : -Number(t.nominal);
      await sql`
        UPDATE transaksi SET saldo_setelah = ${saldoBerjalan} WHERE no_transaksi = ${t.no_transaksi}
      `;
    }

    const perubahan: string[] = [];
    if (Number(old.nominal) !== Number(nominal)) {
      perubahan.push(`nominal Rp${Number(old.nominal).toLocaleString('id-ID')} → Rp${Number(nominal).toLocaleString('id-ID')}`);
    }
    if (old.jenis !== jenis) {
      perubahan.push(`jenis ${old.jenis} → ${jenis}`);
    }
    if (old.keterangan !== keterangan) {
      perubahan.push(`keterangan diubah`);
    }
    const detailLog = perubahan.length > 0
      ? `Mengubah ${noTransaksi}: ${perubahan.join(', ')}`
      : `Mengubah ${noTransaksi} (tidak ada perubahan nilai signifikan)`;

    await sql`
      INSERT INTO log_aktivitas (user_id, no_transaksi, aksi, detail)
      VALUES (${session.userId}, ${noTransaksi}, 'edit_transaksi', ${detailLog})
    `;

    return NextResponse.json({ message: 'Transaksi berhasil diperbarui.' });
  } catch (error) {
    console.error('Update transaksi error:', error);
    return NextResponse.json({ message: 'Gagal memperbarui transaksi.' }, { status: 500 });
  }
}