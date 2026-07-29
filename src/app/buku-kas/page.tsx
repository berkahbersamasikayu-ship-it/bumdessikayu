// src/app/(dashboard)/buku-kas/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, Calendar, FileSpreadsheet, FileText, ImageIcon, TrendingUp, TrendingDown, Wallet, Pencil } from 'lucide-react';
import EditTransaksiModal from '../components/ui/EditTransaksiModal';

interface UnitUsaha {
  id: string;
  nama: string;
}

interface TransaksiRow {
  noTransaksi: string;
  tanggal: string;
  keterangan: string;
  unitUsaha: string;
  jenis: 'Pemasukan' | 'Pengeluaran';
  nominal: number;
  saldoSetelah: number;
  buktiFileUrl: string | null;
}

function formatRupiah(value: number) {
  return value.toLocaleString('id-ID');
}

export default function BukuKasPage() {
  const [unitUsahaList, setUnitUsahaList] = useState<UnitUsaha[]>([]);

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [unitUsahaId, setUnitUsahaId] = useState('');
  const [jenis, setJenis] = useState('');
  const [search, setSearch] = useState('');

  const [totalPemasukan, setTotalPemasukan] = useState(0);
  const [totalPengeluaran, setTotalPengeluaran] = useState(0);
  const [saldoPeriode, setSaldoPeriode] = useState(0);
  const [transaksi, setTransaksi] = useState<TransaksiRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editNoTransaksi, setEditNoTransaksi] = useState<string | null>(null);

  // Ambil daftar unit usaha untuk dropdown filter
  useEffect(() => {
    fetch('/api/unit-usaha')
      .then((res) => res.json())
      .then((data) => setUnitUsahaList(data))
      .catch((err) => console.error(err));
  }, []);

  const fetchBukuKas = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      if (unitUsahaId) params.set('unitUsahaId', unitUsahaId);
      if (jenis) params.set('jenis', jenis);
      if (search) params.set('search', search);

      const res = await fetch(`/api/buku-kas?${params.toString()}`);
      const data = await res.json();

      setTotalPemasukan(data.totalPemasukan || 0);
      setTotalPengeluaran(data.totalPengeluaran || 0);
      setSaldoPeriode(data.saldoPeriode || 0);
      setTransaksi(data.transaksi || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [dateFrom, dateTo, unitUsahaId, jenis, search]);

  // Load pertama kali
  useEffect(() => {
    fetchBukuKas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // AJAX search dengan debounce — otomatis fetch ulang 400ms setelah user berhenti mengetik
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchBukuKas();
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleTerapkanFilter = () => {
    fetchBukuKas();
  };

  const handleExport = (type: 'excel' | 'pdf') => {
    const params = new URLSearchParams();
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    if (unitUsahaId) params.set('unitUsahaId', unitUsahaId);
    if (jenis) params.set('jenis', jenis);
    if (search) params.set('search', search);

    window.open(`/api/buku-kas/export-${type}?${params.toString()}`, '_blank');
  };

  return (
    <div>
      {/* Filter - Diubah menggunakan flex justify-between agar tombol ke kanan */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-semibold text-black mb-1.5">Periode</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-11 w-40 rounded-lg border border-gray-300 px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-900 cursor-pointer"
              />
              <span className="text-sm text-gray-500">s/d</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-11 w-40 rounded-lg border border-gray-300 px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-900 cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-black mb-1.5">Unit Usaha</label>
            <select
              value={unitUsahaId}
              onChange={(e) => setUnitUsahaId(e.target.value)}
              className="w-40 h-11 rounded-lg border border-gray-300 px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-900"
            >
              <option value="">Semua Unit Usaha</option>
              {unitUsahaList.map((u) => (
                <option key={u.id} value={u.id}>{u.nama}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-black mb-1.5">Jenis Transaksi</label>
            <select
              value={jenis}
              onChange={(e) => setJenis(e.target.value)}
              className="w-40 h-11 rounded-lg border border-gray-300 px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-900"
            >
              <option value="">Semua Jenis Transaksi</option>
              <option value="Pemasukan">Pemasukan</option>
              <option value="Pengeluaran">Pengeluaran</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleTerapkanFilter}
          className="h-11 px-6 rounded-full bg-green-700 text-white text-m font-semibold hover:bg-green-800 transition-colors shrink-0"
        >
          Terapkan Filter
        </button>
      </div>

      {/* Cards: Pemasukan, Pengeluaran, Saldo (Dengan tambahan Icon) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="bg-white rounded-2xl shadow-sm border-l-8 border-green-500 border-t border-r border-b border-gray-100 p-5 relative flex flex-col justify-center min-h-[110px]">
          <h3 className="text-black text-base font-semibold">Total Pemasukan</h3>
          <p className="text-2xl font-bold text-black mt-2">Rp{formatRupiah(totalPemasukan)}</p>
          <div className="absolute right-5 top-1/2 -translate-y-1/2 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-green-600" strokeWidth={2} />
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border-l-8 border-red-500 border-t border-r border-b border-gray-100 p-5 relative flex flex-col justify-center min-h-[110px]">
          <h3 className="text-black text-base font-semibold">Total Pengeluaran</h3>
          <p className="text-2xl font-bold text-black mt-2">Rp{formatRupiah(totalPengeluaran)}</p>
          <div className="absolute right-5 top-1/2 -translate-y-1/2 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <TrendingDown className="w-6 h-6 text-red-500" strokeWidth={2} />
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border-l-8 border-indigo-800 border-t border-r border-b border-gray-100 p-5 relative flex flex-col justify-center min-h-[110px]">
          <h3 className="text-black text-base font-semibold">Saldo</h3>
          <p className="text-2xl font-bold text-black mt-2">Rp{formatRupiah(saldoPeriode)}</p>
          <div className="absolute right-5 top-1/2 -translate-y-1/2 w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
            <Wallet className="w-6 h-6 text-indigo-600" strokeWidth={2} />
          </div>
        </div>
      </div>

      {/* Buku Kas */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h2 className="text-xl font-bold text-black">Buku Kas</h2>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari keterangan / no. transaksi..."
                className="h-10 pl-9 pr-4 rounded-lg border border-gray-300 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>

            <button
              onClick={() => handleExport('excel')}
              className="flex items-center gap-2 h-10 px-4 rounded-full bg-green-600 text-white text-sm font-semibold hover:bg-green-700"
            >
              <FileSpreadsheet size={16} /> Export Excel
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="flex items-center gap-2 h-10 px-4 rounded-full bg-blue-900 text-white text-sm font-semibold hover:bg-blue-800"
            >
              <FileText size={16} /> Export PDF
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {/* Gaya Tabel Diubah: Header Biru, Ada Border, Zebra, Font Lebih Besar */}
          <table className="w-full text-left border-collapse border border-gray-200">
            <thead>
              <tr className="bg-blue-800 text-white">
                <th className="p-3 border border-gray-200 text-sm font-semibold">No</th>
                <th className="p-3 border border-gray-200 text-sm font-semibold">Tanggal</th>
                <th className="p-3 border border-gray-200 text-sm font-semibold">No. Transaksi</th>
                <th className="p-3 border border-gray-200 text-sm font-semibold">Keterangan</th>
                <th className="p-3 border border-gray-200 text-sm font-semibold">Unit Usaha</th>
                <th className="p-3 border border-gray-200 text-sm font-semibold text-right">Debit</th>
                <th className="p-3 border border-gray-200 text-sm font-semibold text-right">Kredit</th>
                <th className="p-3 border border-gray-200 text-sm font-semibold text-right">Saldo</th>
                <th className="p-3 border border-gray-200 text-sm font-semibold text-center">Bukti</th>
                <th className="p-3 border border-gray-200 text-sm font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="p-6 text-center text-gray-500 border border-gray-200 text-base">Memuat data...</td>
                </tr>
              ) : transaksi.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-6 text-center text-gray-500 italic border border-gray-200 text-base">
                    Belum ada transaksi yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                transaksi.map((t, idx) => (
                  <tr key={t.noTransaksi} className="odd:bg-white even:bg-gray-50 text-gray-800 hover:bg-blue-50 transition-colors">
                    <td className="p-3 border border-gray-200 text-base">{idx + 1}</td>
                    <td className="p-3 border border-gray-200 text-base">{t.tanggal}</td>
                    <td className="p-3 border border-gray-200 text-base">{t.noTransaksi}</td>
                    <td className="p-3 border border-gray-200 text-base">{t.keterangan}</td>
                    <td className="p-3 border border-gray-200 text-base">{t.unitUsaha}</td>
                    <td className="p-3 border border-gray-200 text-base text-right text-green-700 font-medium">
                      {t.jenis === 'Pemasukan' ? formatRupiah(t.nominal) : '-'}
                    </td>
                    <td className="p-3 border border-gray-200 text-base text-right text-red-600 font-medium">
                      {t.jenis === 'Pengeluaran' ? formatRupiah(t.nominal) : '-'}
                    </td>
                    <td className="p-3 border border-gray-200 text-base text-right font-medium">
                      {formatRupiah(t.saldoSetelah)}
                    </td>
                    <td className="p-3 border border-gray-200 text-center">
                      {t.buktiFileUrl ? (
                        <a href={t.buktiFileUrl} target="_blank" rel="noopener noreferrer" className="flex justify-center">
                          <ImageIcon size={20} className="text-blue-700 hover:text-blue-900" />
                        </a>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="p-3 border border-gray-200 text-center">
                      <button
                        onClick={() => setEditNoTransaksi(t.noTransaksi)}
                        className="text-blue-700 hover:text-blue-900 inline-flex justify-center"
                        title="Edit transaksi"
                      >
                        <Pencil size={20} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <EditTransaksiModal
        open={!!editNoTransaksi}
        noTransaksi={editNoTransaksi}
        onClose={() => setEditNoTransaksi(null)}
        onSuccess={fetchBukuKas}
      />
    </div>
  );
}