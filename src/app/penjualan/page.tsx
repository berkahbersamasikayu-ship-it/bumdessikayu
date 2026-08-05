'use client';

import { useEffect, useState, useCallback } from 'react';
import { Calendar } from 'lucide-react';
import AddPenjualanModal from '../components/ui/AddPenjualanModal';
import { useCurrentUser } from '@/lib/useCurrentUser';


interface UnitUsaha {
  id: string;
  nama: string;
}

interface PenjualanRow {
  id: string;
  tanggal: string;
  namaPembeli: string;
  keterangan: string | null;
  unitUsaha: string;
  kuantitas: number;
  hargaPerKg: number;
  totalHarga: number;
}

export default function DataPenjualanPage() {
  const { isViewer } = useCurrentUser();
  const [unitUsahaList, setUnitUsahaList] = useState<UnitUsaha[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [unitUsahaId, setUnitUsahaId] = useState('');
  const [data, setData] = useState<PenjualanRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetch('/api/unit-usaha')
      .then((res) => res.json())
      .then((data) => setUnitUsahaList(data))
      .catch((err) => console.error(err));
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      if (unitUsahaId) params.set('unitUsahaId', unitUsahaId);

      const res = await fetch(`/api/penjualan?${params.toString()}`);
      setData(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [dateFrom, dateTo, unitUsahaId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div>
      {/* Filter div: Tombol "Terapkan Filter" didorong ke paling kanan */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-full sm:w-auto">
            <label className="block text-sm font-semibold text-black mb-1.5">Periode</label>
            <div className="flex items-center gap-2 w-full">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-11 w-full sm:w-44 flex-1 rounded-lg border border-gray-300 px-2 sm:px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-900 cursor-pointer min-w-0"
              />
              <span className="text-sm text-gray-500 shrink-0">s/d</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-11 w-full sm:w-44 flex-1 rounded-lg border border-gray-300 px-2 sm:px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-900 cursor-pointer min-w-0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-black mb-1.5">Unit Usaha</label>
            <select
              value={unitUsahaId}
              onChange={(e) => setUnitUsahaId(e.target.value)}
              className="w-48 h-11 rounded-lg border border-gray-300 px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-900"
            >
              <option value="">Semua Unit Usaha</option>
              {unitUsahaList.map((u) => (
                <option key={u.id} value={u.id}>{u.nama}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={fetchData}
          className="h-11 px-6 rounded-full bg-green-700 text-white text-sm font-semibold hover:bg-green-800 transition-colors shrink-0"
        >
          Terapkan Filter
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-black">Data Penjualan</h2>
          {!isViewer && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-2.5 rounded-full bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 transition-colors"
            >
              Tambah Data
            </button>
          )}
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-gray-200">
            <thead>
              <tr className="bg-blue-800 text-white">
                <th className="p-3 border border-gray-200 text-sm font-semibold">No.</th>
                <th className="p-3 border border-gray-200 text-sm font-semibold">Tanggal</th>
                <th className="p-3 border border-gray-200 text-sm font-semibold">Nama Pembeli</th>
                <th className="p-3 border border-gray-200 text-sm font-semibold">Unit Usaha</th>
                <th className="p-3 border border-gray-200 text-sm font-semibold text-right">Kuantitas</th>
                <th className="p-3 border border-gray-200 text-sm font-semibold text-right">Harga per Kg</th>
                <th className="p-3 border border-gray-200 text-sm font-semibold text-right">Total Harga</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="p-6 text-center text-gray-500 border border-gray-200 text-base">Memuat data...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={7} className="p-6 text-center text-gray-500 italic border border-gray-200 text-base">Belum ada data penjualan.</td></tr>
              ) : (
                data.map((row, idx) => (
                  <tr key={row.id} className="odd:bg-white even:bg-gray-50 text-gray-800 hover:bg-green-50 transition-colors">
                    <td className="p-3 border border-gray-200 text-base">{idx + 1}.</td>
                    <td className="p-3 border border-gray-200 text-base">{row.tanggal}</td>
                    <td className="p-3 border border-gray-200 text-base font-medium text-gray-900">{row.namaPembeli}</td>
                    <td className="p-3 border border-gray-200 text-base">{row.unitUsaha}</td>
                    <td className="p-3 border border-gray-200 text-base text-right">{row.kuantitas} kg</td>
                    <td className="p-3 border border-gray-200 text-base text-right">Rp{row.hargaPerKg.toLocaleString('id-ID')}</td>
                    <td className="p-3 border border-gray-200 text-base text-right text-green-700 font-semibold">
                      Rp{row.totalHarga.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!isViewer && (
        <AddPenjualanModal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}