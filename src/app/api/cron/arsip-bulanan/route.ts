import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { put } from '@vercel/blob';
import { generateExcelArsip } from '../../../../lib/arsip/generate-excel';
import { generatePdfArsip } from '../../../../lib/arsip/generate-pdf';
import { sendArsipEmail } from '../../../../lib/arsip/send-email';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const now = new Date();
    const bulanTarget = now.getMonth() === 0 ? 12 : now.getMonth();
    const tahunTarget = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

    const cekArsip = await sql`
      SELECT id FROM arsip_bulanan WHERE bulan = ${bulanTarget} AND tahun = ${tahunTarget}
    `;
    if (cekArsip.length > 0) {
      return NextResponse.json({ message: 'Bulan ini sudah diarsipkan sebelumnya.' });
    }

    // 1. Ambil semua transaksi bulan target
    const transaksiBulanLalu = await sql`
      SELECT t.no_transaksi, t.tanggal, t.keterangan, t.jenis, t.nominal, t.saldosetelahtransaksi, t.unit_usaha_id,
        u.nama AS unit_usaha
      FROM transaksi t
      JOIN unit_usaha u ON u.id = t.unit_usaha_id
      WHERE EXTRACT(MONTH FROM t.tanggal) = ${bulanTarget}
        AND EXTRACT(YEAR FROM t.tanggal) = ${tahunTarget}
      ORDER BY t.tanggal ASC, t.created_at ASC
    `;

    if (transaksiBulanLalu.length === 0) {
      return NextResponse.json({ message: 'Tidak ada transaksi bulan lalu untuk diarsipkan.' });
    }

    // 2. Saldo akhir total (kas keseluruhan)
    const saldoAkhirTotal = Number(transaksiBulanLalu[transaksiBulanLalu.length - 1].saldosetelahtransaksi);

    // 3. Generate Excel
    let excelBuffer: Buffer;
    try {
      excelBuffer = await generateExcelArsip(transaksiBulanLalu as any, bulanTarget, tahunTarget, saldoAkhirTotal);
    } catch (err) {
      console.error('Gagal generate Excel:', err);
      return NextResponse.json({ message: 'Gagal membuat file Excel, proses dibatalkan.' }, { status: 500 });
    }

    // 4. Generate PDF
    let pdfBuffer: Buffer;
    try {
      pdfBuffer = generatePdfArsip(transaksiBulanLalu as any, bulanTarget, tahunTarget, saldoAkhirTotal);
    } catch (err) {
      console.error('Gagal generate PDF:', err);
      return NextResponse.json({ message: 'Gagal membuat file PDF, proses dibatalkan.' }, { status: 500 });
    }

    // 5. Upload ke Vercel Blob
    let urlExcel: string;
    let urlPdf: string;
    try {
      const namaFileExcel = `arsip/${tahunTarget}-${String(bulanTarget).padStart(2, '0')}-buku-kas.xlsx`;
      const namaFilePdf = `arsip/${tahunTarget}-${String(bulanTarget).padStart(2, '0')}-buku-kas.pdf`;

      const blobExcel = await put(namaFileExcel, excelBuffer, {
        access: 'public',
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const blobPdf = await put(namaFilePdf, pdfBuffer, {
        access: 'public',
        contentType: 'application/pdf',
      });

      urlExcel = blobExcel.url;
      urlPdf = blobPdf.url;
    } catch (err) {
      console.error('Gagal upload ke Vercel Blob:', err);
      return NextResponse.json({ message: 'Gagal mengunggah arsip, proses dibatalkan.' }, { status: 500 });
    }

    // 6. Kirim email
    try {
      await sendArsipEmail({ bulan: bulanTarget, tahun: tahunTarget, saldoAkhir: saldoAkhirTotal, urlExcel, urlPdf });
    } catch (err) {
      console.error('Gagal mengirim email:', err);
      return NextResponse.json({ message: 'Gagal mengirim email, proses dibatalkan. Data belum dihapus.' }, { status: 500 });
    }

    // --- Semua langkah di atas berhasil, lanjut ke tahap database ---

    // 7. Catat arsip sebagai penanda keberhasilan
    await sql`
      INSERT INTO arsip_bulanan (bulan, tahun, saldo_akhir, jumlah_transaksi, url_excel, url_pdf, status_email)
      VALUES (${bulanTarget}, ${tahunTarget}, ${saldoAkhirTotal}, ${transaksiBulanLalu.length}, ${urlExcel}, ${urlPdf}, 'terkirim')
    `;

    // Hitung saldo akhir PER UNIT USAHA sebelum data dihapus
    const saldoPerUnit = await sql`
      SELECT
        t.unit_usaha_id,
        u.nama AS nama_unit,
        COALESCE(SUM(CASE WHEN t.jenis IN ('Pemasukan', 'saldo_awal') THEN t.nominal ELSE -t.nominal END), 0) AS saldo_unit
      FROM transaksi t
      JOIN unit_usaha u ON u.id = t.unit_usaha_id
      WHERE u.status = 'Aktif'
      GROUP BY t.unit_usaha_id, u.nama
    `;

    // Hapus semua transaksi bulan yang sudah diarsipkan
    await sql`
      DELETE FROM transaksi
      WHERE EXTRACT(MONTH FROM tanggal) = ${bulanTarget}
        AND EXTRACT(YEAR FROM tanggal) = ${tahunTarget}
    `;

    // 8. Buat transaksi Saldo Awal terpisah per unit usaha
    const bulanBaru = bulanTarget === 12 ? 1 : bulanTarget + 1;
    const tahunBaru = bulanTarget === 12 ? tahunTarget + 1 : tahunTarget;
    const tanggalSaldoAwal = `${tahunBaru}-${String(bulanBaru).padStart(2, '0')}-01`;

    const userSistem = await sql`SELECT id FROM users ORDER BY created_at ASC LIMIT 1`;

    for (const unit of saldoPerUnit) {
      await sql`
        INSERT INTO transaksi (tanggal, jenis, unit_usaha_id, keterangan, nominal, saldosetelahtransaki, created_by)
        VALUES (
          ${tanggalSaldoAwal}, 'saldo_awal', ${unit.unit_usaha_id},
          ${'Saldo Awal Bulan - ' + unit.nama_unit}, ${Math.abs(Number(unit.saldo_unit))},
          ${Number(unit.saldo_unit)}, ${userSistem[0].id}
        )
      `;
    }

    // Hitung ulang saldo_setelah global secara kronologis (karena ada beberapa baris saldo_awal sekaligus)
    const semuaTransaksiBaru = await sql`
      SELECT no_transaksi, jenis, nominal FROM transaksi
      ORDER BY tanggal ASC, created_at ASC
    `;

    let saldoBerjalanGlobal = 0;
    for (const t of semuaTransaksiBaru) {
      saldoBerjalanGlobal += (t.jenis === 'Pemasukan' || t.jenis === 'saldo_awal')
        ? Number(t.nominal)
        : -Number(t.nominal);
      await sql`UPDATE transaksi SET saldosetelahtransaksi = ${saldoBerjalanGlobal} WHERE no_transaksi = ${t.no_transaksi}`;
    }

    return NextResponse.json({
      message: `Arsip bulan ${bulanTarget}/${tahunTarget} berhasil dibuat, data lama dihapus, saldo awal per unit usaha dibuat.`,
      saldoAkhirTotal,
      jumlahUnitDenganSaldoAwal: saldoPerUnit.length,
      urlExcel,
      urlPdf,
    });
  } catch (error) {
    console.error('Cron arsip bulanan error:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan saat proses arsip.' }, { status: 500 });
  }
}