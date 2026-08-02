import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getLogoBase64 } from '@/lib/get-logo-base64';

interface TransaksiArsip {
  no_transaksi: string;
  tanggal: Date;
  keterangan: string;
  jenis: string;
  nominal: number;
  saldosetelahtransaksi: number;
  unit_usaha: string;
}

export function generatePdfArsip(
  transaksi: TransaksiArsip[],
  bulan: number,
  tahun: number,
  saldoAkhir: number
): Buffer {
  const namaBulan = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const logoBase64 = getLogoBase64();

  if (logoBase64) {
    doc.addImage(logoBase64, 'PNG', 14, 10, 18, 18);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(30, 58, 138);
  doc.text('BUMDes Sikayu', logoBase64 ? 36 : 14, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Arsip Buku Kas - ${namaBulan[bulan - 1]} ${tahun}`, logoBase64 ? 36 : 14, 21);

  doc.setDrawColor(220, 220, 220);
  doc.line(14, 32, pageWidth - 14, 32);

  autoTable(doc, {
    startY: 38,
    head: [['No', 'Tanggal', 'No. Transaksi', 'Keterangan', 'Unit Usaha', 'Debit', 'Kredit', 'Saldo']],
    body: transaksi.map((t, idx) => [
      idx + 1,
      new Date(t.tanggal).toLocaleDateString('id-ID'),
      t.no_transaksi,
      t.keterangan,
      t.unit_usaha,
      t.jenis === 'Pemasukan' || t.jenis === 'saldo_awal' ? Number(t.nominal).toLocaleString('id-ID') : '-',
      t.jenis === 'Pengeluaran' ? Number(t.nominal).toLocaleString('id-ID') : '-',
      Number(t.saldosetelahtransaksi).toLocaleString('id-ID'),
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [30, 58, 138] },
    foot: [['', '', '', '', '', '', 'Saldo Akhir', saldoAkhir.toLocaleString('id-ID')]],
    footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
  });

  return Buffer.from(doc.output('arraybuffer'));
}