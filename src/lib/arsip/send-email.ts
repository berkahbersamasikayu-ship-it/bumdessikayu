import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendArsipEmail({
  bulan,
  tahun,
  saldoAkhir,
  urlExcel,
  urlPdf,
}: {
  bulan: number;
  tahun: number;
  saldoAkhir: number;
  urlExcel: string;
  urlPdf: string;
}) {
  const namaBulan = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  const tujuan = process.env.ARSIP_EMAIL_TUJUAN;
  if (!tujuan) {
    throw new Error('ARSIP_EMAIL_TUJUAN belum diatur di environment variable.');
  }

  const { data, error } = await resend.emails.send({
    from: 'BUMDes Sikayu <onboarding@resend.dev>', // ganti setelah domain terverifikasi
    to: tujuan,
    subject: `Arsip Buku Kas ${namaBulan[bulan - 1]} ${tahun} - BUMDes Sikayu`,
    html: `
      <p>Halo,</p>
      <p>Berikut arsip buku kas bulan <strong>${namaBulan[bulan - 1]} ${tahun}</strong>:</p>
      <ul>
        <li>Saldo akhir bulan: <strong>Rp${saldoAkhir.toLocaleString('id-ID')}</strong></li>
        <li>File Excel: <a href="${urlExcel}">Unduh Excel</a></li>
        <li>File PDF: <a href="${urlPdf}">Unduh PDF</a></li>
      </ul>
      <p>Data transaksi bulan ini telah diarsipkan dan dihapus dari database aktif untuk menjaga performa sistem. Arsip tetap dapat diakses kapan saja melalui link di atas.</p>
      <p>Email ini dikirim otomatis oleh Sistem Keuangan BUMDes Sikayu.</p>
    `,
  });

  if (error) {
    throw new Error(`Gagal mengirim email: ${error.message}`);
  }

  return data;
}