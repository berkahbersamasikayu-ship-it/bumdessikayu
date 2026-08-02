'use client';

import { useEffect, useState, useCallback } from 'react';
import AddUnitUsahaModal from '../components/ui/AddUnitUsahaModal';
import { useCurrentUser } from '@/lib/useCurrentUser';


interface UnitUsahaRow {
  id: string;
  nama: string;
  status: 'Aktif' | 'Tidak Aktif';
  saldo: number;
}

export default function UnitUsahaPage() {
  const { isViewer } = useCurrentUser();
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
      {/* Diubah jadi flex-col untuk HP, dan sm:flex-row untuk layar lebar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 ml-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-black">Daftar Unit Usaha</h1>
        {!isViewer && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-2.5 sm:px-8 sm:py-3 rounded-full bg-green-700 text-white text-sm sm:text-lg font-semibold hover:bg-green-800 shrink-0"
          >
            Tambah Unit Usaha
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 overflow-x-auto">
        <table className="w-full text-left border-collapse border border-gray-200 min-w-[600px]">
          <thead>
            <tr className="bg-green-700 text-white">
              <th className="p-3 border border-gray-200 text-sm font-semibold">No.</th>
              <th className="p-3 border border-gray-200 text-sm font-semibold">Nama Unit Usaha</th>
              <th className="p-3 border border-gray-200 text-sm font-semibold">Saldo Saat Ini</th>
              <th className="p-3 border border-gray-200 text-sm font-semibold">Status</th>
              {!isViewer && (
                <th className="p-3 border border-gray-200 text-sm font-semibold text-center">Aksi</th>
              )}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={isViewer ? 4 : 5} className="p-6 text-center text-gray-500 border border-gray-200 text-base">Memuat data...</td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={isViewer ? 4 : 5} className="p-6 text-center text-gray-500 italic border border-gray-200 text-base">
                  Belum ada unit usaha. Klik &quot;Tambah Unit Usaha&quot; untuk menambahkan.
                </td>
              </tr>
            ) : (
              data.map((unit, idx) => (
                <tr key={unit.id} className="odd:bg-white even:bg-gray-50 text-gray-800 hover:bg-green-50 transition-colors">
                  <td className="p-3 border border-gray-200 text-base">{idx + 1}.</td>
                  <td className="p-3 border border-gray-200 text-base font-medium text-gray-900">{unit.nama}</td>
                  <td className="p-3 border border-gray-200 text-base">
                    Rp{unit.saldo.toLocaleString('id-ID')}
                  </td>
                  <td className="p-3 border border-gray-200 text-base">
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
                  {!isViewer && (
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
                  </td>)}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!isViewer && (
        <AddUnitUsahaModal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}