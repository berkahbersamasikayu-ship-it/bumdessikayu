import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';
import { requireEditor } from '@/lib/require-editor';

export async function GET(req: NextRequest, { params }: { params: Promise<{ noTransaksi: string }> }) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ message: 'Sesi tidak valid.' }, { status: 401 });
    }
    
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
    const { error, session } = await requireEditor();
    if (error) return error;
    const { noTransaksi } = await params;
    
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ message: 'Sesi tidak valid.' }, { status: 401 });
    }

    const { tanggal, jenis, unitUsahaId, keterangan, nominal, buktiFileUrl } = await req.json();
    const nominalNumber = Number(nominal);

    if (!tanggal || !jenis || !unitUsahaId || !keterangan || !nominal) {
      return NextResponse.json({ message: 'Semua field wajib diisi kecuali bukti.' }, { status: 400 });
    }

    if (!Number.isFinite(nominalNumber) || nominalNumber <= 0) {
      return NextResponse.json({ message: 'Nominal harus lebih dari 0.' }, { status: 400 });
    }

    // Ambil data lama sekaligus created_at agar urutan simulasi tidak berantakan
    const oldResult = await sql`
      SELECT tanggal, jenis, keterangan, nominal, created_at FROM transaksi WHERE no_transaksi = ${noTransaksi}
    `;
    if (oldResult.length === 0) {
      return NextResponse.json({ message: 'Transaksi tidak ditemukan.' }, { status: 404 });
    }
    const old = oldResult[0];

    // Ambil transaksi lain (kecuali yang sedang diedit ini)
    const transaksiLain = await sql`
      SELECT no_transaksi, tanggal, jenis, nominal, created_at
      FROM transaksi
      WHERE no_transaksi != ${noTransaksi}
    `;

    // Gabungkan dengan data baru hasil editan dan urutkan ulang secara kronologis
    const transaksiSimulasi = [
      ...transaksiLain,
      {
        no_transaksi: noTransaksi,
        tanggal: tanggal,
        jenis: jenis,
        nominal: nominalNumber,
        created_at: old.created_at, // Pertahankan waktu dibuat untuk konsistensi urutan
      },
    ].sort((a, b) => {
      const tanggalA = new Date(a.tanggal).getTime();
      const tanggalB = new Date(b.tanggal).getTime();
      if (tanggalA !== tanggalB) return tanggalA - tanggalB;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    // Cek apakah perubahan ini memicu minus pada urutan manapun
    let saldoSimulasi = 0;
    for (const t of transaksiSimulasi) {
      saldoSimulasi += (t.jenis === 'Pemasukan' || t.jenis === 'saldo_awal')
        ? Number(t.nominal)
        : -Number(t.nominal);

      if (saldoSimulasi < 0) {
        return NextResponse.json({ message: 'Perubahan ini akan membuat saldo menjadi minus pada urutan buku kas.' }, { status: 400 });
      }
    }

    // Eksekusi update transaksi
    await sql`
      UPDATE transaksi
      SET tanggal = ${tanggal}, jenis = ${jenis}, unit_usaha_id = ${unitUsahaId},
          keterangan = ${keterangan}, nominal = ${nominalNumber},
          bukti_file_url = ${buktiFileUrl !== undefined ? buktiFileUrl : sql`bukti_file_url`},
          updated_at = now()
      WHERE no_transaksi = ${noTransaksi}
    `;

    // Hitung ulang saldo setelah transaksi secara global menggunakan Window Function (1x Query)
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

    // Catat log
    const perubahan: string[] = [];
    if (Number(old.nominal) !== Number(nominal)) {
      perubahan.push(`nominal Rp${Number(old.nominal).toLocaleString('id-ID')} → Rp${nominalNumber.toLocaleString('id-ID')}`);
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