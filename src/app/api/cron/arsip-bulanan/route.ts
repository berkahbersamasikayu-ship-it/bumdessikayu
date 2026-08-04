import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { put } from '@vercel/blob';
import { generateExcelArsip } from '../../../../lib/arsip/generate-excel';
import { generatePdfArsip } from '../../../../lib/arsip/generate-pdf';
import { sendArsipEmail } from '../../../../lib/arsip/send-email';
import { buildExcel, buildPdf } from '@/lib/monitoring-export-helper';
import { sendArsipPakanEmail } from '@/lib/arsip/send-email-pakan';
import JSZip from 'jszip';

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
      SELECT t.no_transaksi, t.tanggal, t.keterangan, t.jenis, t.nominal, t.saldosetelahtransaksi, t.unit_usaha_id, t.bukti_file_url,
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

    // --- 4.5 GENERATE ZIP BUKTI TRANSAKSI ---
    const zip = new JSZip();
    let zipBuffer: Buffer | null = null;
    
    // Filter transaksi yang punya URL bukti
    const transaksiDenganBukti = transaksiBulanLalu.filter(t => t.bukti_transaksi);
    
    if (transaksiDenganBukti.length > 0) {
      // Unduh semua gambar secara paralel menggunakan Promise.all agar cepat
      await Promise.all(transaksiDenganBukti.map(async (trx) => {
        try {
          const response = await fetch(trx.bukti_transaksi);
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            // Ambil ekstensi dari URL (misal: .png, .jpg), default ke .jpg
            const ekstensi = trx.bukti_transaksi.split('.').pop()?.split('?')[0] || 'jpg';
            // Nama file di dalam zip: TRX-202607-001.jpg
            const namaFile = `${trx.no_transaksi}.${ekstensi}`; 
            
            zip.file(namaFile, arrayBuffer);
          }
        } catch (error) {
          console.error(`Gagal download bukti untuk transaksi ${trx.no_transaksi}`, error);
        }
      }));

      // Generate buffer ZIP jika ada file yang berhasil dimasukkan
      if (Object.keys(zip.files).length > 0) {
        zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
      }
    }

    // 5. Upload ke Vercel Blob
    let urlExcel: string;
    let urlPdf: string;
    let urlZip: string | null = null;

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

      if (zipBuffer) {
        const namaFileZip = `arsip/${tahunTarget}-${String(bulanTarget).padStart(2, '0')}-bukti-transaksi.zip`;
        const blobZip = await put(namaFileZip, zipBuffer, {
          access: 'public',
          contentType: 'application/zip',
        });
        urlZip = blobZip.url;
      }
    } catch (err) {
      console.error('Gagal upload ke Vercel Blob:', err);
      return NextResponse.json({ message: 'Gagal mengunggah arsip, proses dibatalkan.' }, { status: 500 });
    }

    // 6. Kirim email
    try {
      await sendArsipEmail({ bulan: bulanTarget, tahun: tahunTarget, saldoAkhir: saldoAkhirTotal, urlExcel, urlPdf, urlZip });
    } catch (err) {
      console.error('Gagal mengirim email:', err);
      return NextResponse.json({ message: 'Gagal mengirim email, proses dibatalkan. Data belum dihapus.' }, { status: 500 });
    }

    
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
    try {
      await sql`
        DELETE FROM transaksi
        WHERE EXTRACT(MONTH FROM tanggal) = ${bulanTarget}
          AND EXTRACT(YEAR FROM tanggal) = ${tahunTarget}
      `;
    } catch (err) {
      console.error('Gagal menghapus transaksi lama, kemungkinan masih ada foreign key yang belum diperbaiki:', err);
      return NextResponse.json({
        message: 'Gagal menghapus transaksi bulan lalu (kemungkinan constraint FK). Arsip Excel/PDF/email sudah terkirim, tapi data belum terhapus. Cek pg_constraint.',
      }, { status: 500 });
    }

    // Buat transaksi Saldo Awal terpisah per unit usaha
    const bulanBaru = bulanTarget === 12 ? 1 : bulanTarget + 1;
    const tahunBaru = bulanTarget === 12 ? tahunTarget + 1 : tahunTarget;
    const tanggalSaldoAwal = `${tahunBaru}-${String(bulanBaru).padStart(2, '0')}-01`;

    const userSistem = await sql`SELECT id FROM users ORDER BY created_at ASC LIMIT 1`;

    for (const unit of saldoPerUnit) {
      await sql`
        INSERT INTO transaksi (tanggal, jenis, unit_usaha_id, keterangan, nominal, saldosetelahtransaksi, created_by)
        VALUES (
          ${tanggalSaldoAwal}, 'saldo_awal', ${unit.unit_usaha_id},
          ${'Saldo Awal Bulan - ' + unit.nama_unit}, ${Math.abs(Number(unit.saldo_unit))},
          ${Number(unit.saldo_unit)}, ${userSistem[0].id}
        )
      `;
    }

    // Hitung ulang saldo_setelah global
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

    // BARU sekarang catat penanda arsip — setelah semua proses transaksi benar-benar sukses
    await sql`
      INSERT INTO arsip_bulanan (bulan, tahun, saldo_akhir, jumlah_transaksi, url_excel, url_pdf, url_zip, status_email)
      VALUES (${bulanTarget}, ${tahunTarget}, ${saldoAkhirTotal}, ${transaksiBulanLalu.length}, ${urlExcel}, ${urlPdf}, ${urlZip}, 'terkirim')
    `;

    try {
      const cekArsipPakan = await sql`
        SELECT id FROM arsip_monitoring_pakan WHERE bulan = ${bulanTarget} AND tahun = ${tahunTarget}
      `;

      if (cekArsipPakan.length === 0) {
        const pakanBulanLalu = await sql`
          SELECT m.tanggal, k.nama_kolam, m.jenis_pakan, m.jumlah_pakan, m.jam_pemberian, m.sisa_pakan
          FROM monitoring_pakan m
          JOIN kolam k ON k.id = m.kolam_id
          WHERE EXTRACT(MONTH FROM m.tanggal) = ${bulanTarget}
            AND EXTRACT(YEAR FROM m.tanggal) = ${tahunTarget}
          ORDER BY m.tanggal ASC
        `;

        if (pakanBulanLalu.length > 0) {
          const jenisPakanLabel: Record<string, string> = { pelet: 'Pelet', maggot: 'Maggot', azolla: 'Azolla' };
          const headers = ['No', 'Tanggal', 'Kolam', 'Jenis Pakan', 'Jumlah (kg)', 'Jam', 'Sisa (kg)'];
          const body = pakanBulanLalu.map((r, idx) => [
            idx + 1,
            new Date(r.tanggal).toLocaleDateString('id-ID'),
            r.nama_kolam,
            jenisPakanLabel[r.jenis_pakan],
            Number(r.jumlah_pakan).toFixed(2),
            r.jam_pemberian || '-',
            r.sisa_pakan ? Number(r.sisa_pakan).toFixed(2) : '-',
          ]);

          const excelBufferPakan = await buildExcel(
            `Monitoring Pakan ${bulanTarget}-${tahunTarget}`, headers, body
          );
          const pdfBufferPakan = buildPdf(
            `Monitoring Pakan ${bulanTarget}-${tahunTarget}`, headers, body
          );

          const namaFileExcelPakan = `arsip-pakan/${tahunTarget}-${String(bulanTarget).padStart(2, '0')}-monitoring-pakan.xlsx`;
          const namaFilePdfPakan = `arsip-pakan/${tahunTarget}-${String(bulanTarget).padStart(2, '0')}-monitoring-pakan.pdf`;

          const blobExcelPakan = await put(namaFileExcelPakan, excelBufferPakan, {
            access: 'public',
            contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          });
          const blobPdfPakan = await put(namaFilePdfPakan, pdfBufferPakan, {
            access: 'public',
            contentType: 'application/pdf',
          });

          // Kirim email terpisah untuk arsip pakan (pakai fungsi email yang sudah ada, disesuaikan pesannya)
          await sendArsipPakanEmail({
            bulan: bulanTarget,
            tahun: tahunTarget,
            jumlahCatatan: pakanBulanLalu.length,
            urlExcel: blobExcelPakan.url,
            urlPdf: blobPdfPakan.url,
          });

          await sql`
            INSERT INTO arsip_monitoring_pakan (bulan, tahun, jumlah_catatan, url_excel, url_pdf)
            VALUES (${bulanTarget}, ${tahunTarget}, ${pakanBulanLalu.length}, ${blobExcelPakan.url}, ${blobPdfPakan.url})
          `;

          // Setelah arsip pakan berhasil dikirim & dicatat, baru hapus data pakan bulan itu
          await sql`
            DELETE FROM monitoring_pakan
            WHERE EXTRACT(MONTH FROM tanggal) = ${bulanTarget}
              AND EXTRACT(YEAR FROM tanggal) = ${tahunTarget}
          `;
        }
      }
    } catch (err) {
      // Kalau arsip pakan gagal, JANGAN batalkan proses arsip keuangan yang sudah selesai duluan
      // cukup log error-nya, data pakan bulan itu tidak akan terhapus dan bisa dicoba lagi bulan depan
      console.error('Gagal arsip monitoring pakan (tidak mempengaruhi arsip keuangan):', err);
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