import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendArsipPakanEmail({
  bulan, tahun, jumlahCatatan, urlExcel, urlPdf,
}: { bulan: number; tahun: number; jumlahCatatan: number; urlExcel: string; urlPdf: string }) {
  const namaBulan = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  const tujuan = process.env.ARSIP_EMAIL_TUJUAN;
  if (!tujuan) throw new Error('ARSIP_EMAIL_TUJUAN belum diatur.');

  const { error } = await resend.emails.send({
    from: 'BUMDes Sikayu <onboarding@resend.dev>',
    to: tujuan,
    subject: `Arsip Monitoring Pakan Lele ${namaBulan[bulan - 1]} ${tahun}`,
    html: `
      <p>Halo,</p>
      <p>Berikut arsip monitoring pakan lele bulan <strong>${namaBulan[bulan - 1]} ${tahun}</strong> (${jumlahCatatan} catatan):</p>
      <ul>
        <li>File Excel: <a href="${urlExcel}">Unduh Excel</a></li>
        <li>File PDF: <a href="${urlPdf}">Unduh PDF</a></li>
      </ul>
      <p>Data pakan bulan ini telah diarsipkan dan dihapus dari database aktif.</p>
    `,
  });

  if (error) throw new Error(`Gagal mengirim email arsip pakan: ${error.message}`);
}