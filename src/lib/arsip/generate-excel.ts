import ExcelJS from 'exceljs';

interface TransaksiArsip {
  no_transaksi: string;
  tanggal: Date;
  keterangan: string;
  jenis: string;
  nominal: number;
  saldosetelahtransaksi: number;
  unit_usaha: string;
}

export async function generateExcelArsip(
  transaksi: TransaksiArsip[],
  bulan: number,
  tahun: number,
  saldoAkhir: number
): Promise<Buffer> {
  const namaBulan = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(`Arsip ${namaBulan[bulan - 1]} ${tahun}`);

  sheet.mergeCells('A1:H1');
  sheet.getCell('A1').value = `Arsip Buku Kas BUMDes Sikayu - ${namaBulan[bulan - 1]} ${tahun}`;
  sheet.getCell('A1').font = { bold: true, size: 14 };

  sheet.getRow(3).values = ['No', 'Tanggal', 'No. Transaksi', 'Keterangan', 'Unit Usaha', 'Debit', 'Kredit', 'Saldo'];
  sheet.getRow(3).font = { bold: true };

  sheet.columns = [
    { key: 'no', width: 6 },
    { key: 'tanggal', width: 14 },
    { key: 'noTransaksi', width: 20 },
    { key: 'keterangan', width: 30 },
    { key: 'unitUsaha', width: 16 },
    { key: 'debit', width: 16 },
    { key: 'kredit', width: 16 },
    { key: 'saldo', width: 16 },
  ];

  transaksi.forEach((t, idx) => {
    sheet.addRow({
      no: idx + 1,
      tanggal: new Date(t.tanggal).toLocaleDateString('id-ID'),
      noTransaksi: t.no_transaksi,
      keterangan: t.keterangan,
      unitUsaha: t.unit_usaha,
      debit: t.jenis === 'Pemasukan' || t.jenis === 'saldo_awal' ? Number(t.nominal) : 0,
      kredit: t.jenis === 'Pengeluaran' ? Number(t.nominal) : 0,
      saldo: Number(t.saldosetelahtransaksi),
    });
  });

  sheet.addRow({});
  const lastRow = sheet.addRow({ keterangan: 'Saldo Akhir Bulan', saldo: saldoAkhir });
  lastRow.font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}