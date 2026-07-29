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

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-gray-700 border-b border-gray-200">
              <th className="py-3 pr-3 font-semibold">No.</th>
              <th className="py-3 pr-3 font-semibold">Nama</th>
              <th className="py-3 pr-3 font-semibold">Username</th>
              <th className="py-3 pr-3 font-semibold">Status</th>
              <th className="py-3 pr-3 font-semibold text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={5} className="py-8 text-center text-gray-400">Memuat data...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-gray-400 italic">Belum ada akun.</td></tr>
            ) : (
              data.map((akun, idx) => (
                <tr key={akun.id}>
                  <td className="py-3 pr-3 text-gray-700">{idx + 1}.</td>
                  <td className="py-3 pr-3 text-gray-900 font-medium">{akun.nama}</td>
                  <td className="py-3 pr-3 text-gray-700">{akun.username}</td>
                  <td className="py-3 pr-3">
                    <span className={akun.status === 'Aktif' ? 'text-green-700 font-medium' : 'text-gray-400 font-medium'}>
                      {akun.status === 'Aktif' ? 'Aktif' : 'Tidak Aktif'}
                    </span>
                  </td>
                  <td className="py-3 pr-3 text-center">
                    <div className="flex items-center justify-center gap-2 text-sm font-semibold">
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