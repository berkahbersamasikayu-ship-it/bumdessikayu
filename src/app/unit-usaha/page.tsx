'use client';

import { useEffect, useState, useCallback } from 'react';
import AddUnitUsahaModal from '../components/ui/AddUnitUsahaModal';

interface UnitUsahaRow {
  id: string;
  nama: string;
  status: 'Aktif' | 'Tidak Aktif';
  saldo: number;
}

export default function UnitUsahaPage() {
  const [data, setData] = useState<UnitUsahaRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/unit-usaha');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggleStatus = async (unit: UnitUsahaRow) => {
    const newStatus = unit.status === 'Aktif' ? 'Tidak Aktif' : 'Aktif';
    const confirmText =
      newStatus === 'Tidak Aktif'
        ? `Nonaktifkan unit usaha "${unit.nama}"? Unit ini tidak akan muncul lagi di form transaksi baru.`
        : `Aktifkan kembali unit usaha "${unit.nama}"?`;

    if (!confirm(confirmText)) return;

    setProcessingId(unit.id);
    try {
      const res = await fetch(`/api/unit-usaha/${unit.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Gagal mengubah status.');
      }

      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal mengubah status.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6 ml-1">
        <h1 className="text-3xl font-bold text-black">Daftar Unit Usaha</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-8 py-3 rounded-full bg-green-700 text-white text-lg font-semibold hover:bg-green-800"
        >
          Tambah Unit Usaha
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <table className="w-full text-left border-collapse border border-gray-200">
          <thead>
            <tr className="bg-green-700 text-white">
              <th className="p-3 border border-gray-200 text-sm font-semibold text-center">No.</th>
              <th className="p-3 border border-gray-200 text-sm font-semibold text-center">Nama Unit Usaha</th>
              <th className="p-3 border border-gray-200 text-sm font-semibold text-center">Saldo Saat Ini</th>
              <th className="p-3 border border-gray-200 text-sm font-semibold text-center">Status</th>
              <th className="p-3 border border-gray-200 text-sm font-semibold text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-500 border border-gray-200 text-base">Memuat data...</td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-500 italic border border-gray-200 text-base">
                  Belum ada unit usaha. Klik &quot;Tambah Unit Usaha&quot; untuk menambahkan.
                </td>
              </tr>
            ) : (
              data.map((unit, idx) => (
                <tr key={unit.id} className="odd:bg-white even:bg-gray-50 text-gray-800 hover:bg-green-50 transition-colors">
                  <td className="p-3 border border-gray-200 text-base text-center">{idx + 1}.</td>
                  <td className="p-3 border border-gray-200 text-base font-medium text-gray-900">{unit.nama}</td>
                  <td className="p-3 border border-gray-200 text-base text-right">
                    Rp{unit.saldo.toLocaleString('id-ID')}
                  </td>
                  <td className="p-3 border border-gray-200 text-base text-center">
                    <span
                      className={
                        unit.status === 'Aktif'
                          ? 'text-green-700 font-medium'
                          : 'text-gray-400 font-medium'
                      }
                    >
                      {unit.status === 'Aktif' ? 'Aktif' : 'Tidak Aktif'}
                    </span>
                  </td>
                  <td className="p-3 border border-gray-200 text-center">
                    <button
                      onClick={() => handleToggleStatus(unit)}
                      disabled={processingId === unit.id}
                      className={`font-semibold text-base hover:underline disabled:opacity-50 ${
                        unit.status === 'Aktif' ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {processingId === unit.id
                        ? 'Memproses...'
                        : unit.status === 'Aktif'
                        ? 'Nonaktifkan'
                        : 'Aktifkan'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AddUnitUsahaModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchData}
      />
    </div>
  );
}