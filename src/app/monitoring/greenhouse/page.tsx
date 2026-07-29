// src/app/(dashboard)/monitoring/greenhouse/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search } from 'lucide-react';
import AddGreenhouseModal from '../../components/ui/monitoring/AddGreenhouseModal';

interface GreenhouseRow {
  id: string;
  tanggal: string;
  kondisi_gh: string;
  irigasi_tetes: string;
  kondisi_tanaman: string;
  hama_penyakit: string;
  pemupukan: string;
  pembungaan_pembuahan: string;
  tindakan: string | null;
}

const labelMap: Record<string, string> = {
  baik: 'Baik',
  perlu_dibersihkan: 'Perlu Dibersihkan',
  normal: 'Normal',
  bocor: 'Bocor',
  tersumbat: 'Tersumbat',
  sehat: 'Sehat',
  layu: 'Layu',
  mati: 'Mati',
  tidak_ada: 'Tidak Ada',
  ada: 'Ada',
  sudah: 'Sudah',
  belum: 'Belum',
  berbunga: 'Berbunga',
  berbuah: 'Berbuah',
};

export default function MonitoringGreenhousePage() {
  const [search, setSearch] = useState('');
  const [data, setData] = useState<GreenhouseRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const res = await fetch(`/api/monitoring-greenhouse?${params.toString()}`);
      setData(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchData();
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-black">Monitoring Greenhouse</h1>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari catatan tindakan..."
              className="h-10 pl-9 pr-4 rounded-lg border border-gray-300 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-2.5 rounded-lg bg-green-700 text-white font-semibold text-sm hover:bg-green-800"
          >
            Tambah Data
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-gray-700 border-b border-gray-200">
              <th className="py-3 pr-3 font-semibold">Minggu/Tanggal</th>
              <th className="py-3 pr-3 font-semibold">Kondisi GH</th>
              <th className="py-3 pr-3 font-semibold">Irigasi Tetes</th>
              <th className="py-3 pr-3 font-semibold">Kondisi Tanaman</th>
              <th className="py-3 pr-3 font-semibold">Hama/Penyakit</th>
              <th className="py-3 pr-3 font-semibold">Pemupukan</th>
              <th className="py-3 pr-3 font-semibold">Pembungaan/Pembuahan</th>
              <th className="py-3 pr-3 font-semibold">Tindakan yang Dilakukan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={8} className="py-8 text-center text-gray-400">Memuat data...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={8} className="py-8 text-center text-gray-400 italic">Belum ada data yang cocok.</td></tr>
            ) : (
              data.map((row) => (
                <tr key={row.id}>
                  <td className="py-3 pr-3 text-gray-700">{new Date(row.tanggal).toLocaleDateString('id-ID')}</td>
                  <td className="py-3 pr-3 text-gray-700">{labelMap[row.kondisi_gh]}</td>
                  <td className="py-3 pr-3 text-gray-700">{labelMap[row.irigasi_tetes]}</td>
                  <td className="py-3 pr-3 text-gray-700">{labelMap[row.kondisi_tanaman]}</td>
                  <td className="py-3 pr-3 text-gray-700">{labelMap[row.hama_penyakit]}</td>
                  <td className="py-3 pr-3 text-gray-700">{labelMap[row.pemupukan]}</td>
                  <td className="py-3 pr-3 text-gray-700">{labelMap[row.pembungaan_pembuahan]}</td>
                  <td className="py-3 pr-3 text-gray-700">{row.tindakan || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AddGreenhouseModal open={showModal} onClose={() => setShowModal(false)} onSuccess={fetchData} />
    </div>
  );
}