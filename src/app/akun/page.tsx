// src/app/(dashboard)/akun/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import AddAkunModal from '../components/ui/AddAkunModal';
import EditAkunModal from '../components/ui/EditAkunModal';

interface AkunRow {
  id: string;
  nama: string;
  username: string;
  status: 'Aktif' | 'Tidak Aktif';
}

export default function ManajemenAkunPage() {
  const [data, setData] = useState<AkunRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editAkun, setEditAkun] = useState<AkunRow | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/akun');
      setData(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggleStatus = async (akun: AkunRow) => {
    const newStatus = akun.status === 'Aktif' ? 'Tidak Aktif' : 'Aktif';
    const confirmText =
      newStatus === 'Tidak Aktif'
        ? `Nonaktifkan akun "${akun.nama}"? Akun ini tidak akan bisa login lagi.`
        : `Aktifkan kembali akun "${akun.nama}"?`;

    if (!confirm(confirmText)) return;

    setProcessingId(akun.id);
    try {
      const res = await fetch(`/api/akun/${akun.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || 'Gagal mengubah status.');
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
        <h1 className="text-3xl font-bold text-black">Manajemen Akun</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 rounded-full bg-green-700 text-white text-lg font-semibold hover:bg-green-800"
        >
          Tambah Akun
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-x-auto">
        <table className="w-full text-left border-collapse border border-gray-200">
          <thead>
            <tr className="bg-green-700 text-white">
              <th className="p-3 border border-gray-200 text-sm font-semibold">No.</th>
              <th className="p-3 border border-gray-200 text-sm font-semibold">Nama</th>
              <th className="p-3 border border-gray-200 text-sm font-semibold">Username</th>
              <th className="p-3 border border-gray-200 text-sm font-semibold">Status</th>
              <th className="p-3 border border-gray-200 text-sm font-semibold text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="p-6 text-center text-gray-500 border border-gray-200 text-base">Memuat data...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={5} className="p-6 text-center text-gray-500 italic border border-gray-200 text-base">Belum ada akun.</td></tr>
            ) : (
              data.map((akun, idx) => (
                <tr key={akun.id} className="odd:bg-white even:bg-gray-50 text-gray-800 hover:bg-green-50 transition-colors">
                  <td className="p-3 border border-gray-200 text-base">{idx + 1}.</td>
                  <td className="p-3 border border-gray-200 text-base font-medium text-gray-900">{akun.nama}</td>
                  <td className="p-3 border border-gray-200 text-base">{akun.username}</td>
                  <td className="p-3 border border-gray-200 text-base">
                    <span className={akun.status === 'Aktif' ? 'text-green-700 font-medium' : 'text-gray-400 font-medium'}>
                      {akun.status === 'Aktif' ? 'Aktif' : 'Tidak Aktif'}
                    </span>
                  </td>
                  <td className="p-3 border border-gray-200 text-center">
                    <div className="flex items-center justify-center gap-2 text-base font-semibold">
                      <button onClick={() => setEditAkun(akun)} className="text-blue-700 hover:underline">
                        Edit
                      </button>
                      <span className="text-gray-300">/</span>
                      <button
                        onClick={() => handleToggleStatus(akun)}
                        disabled={processingId === akun.id}
                        className={`hover:underline disabled:opacity-50 ${
                          akun.status === 'Aktif' ? 'text-red-600' : 'text-green-600'
                        }`}
                      >
                        {processingId === akun.id ? 'Memproses...' : akun.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AddAkunModal open={showAddModal} onClose={() => setShowAddModal(false)} onSuccess={fetchData} />
      <EditAkunModal open={!!editAkun} akun={editAkun} onClose={() => setEditAkun(null)} onSuccess={fetchData} />
    </div>
  );
}