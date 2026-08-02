'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search } from 'lucide-react';
import AddGreenhouseModal from '../../components/ui/monitoring/AddGreenhouseModal';
import { useCurrentUser } from '@/lib/useCurrentUser';

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
  const { isViewer } = useCurrentUser();
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
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-black">Monitoring Greenhouse</h1>

        <div className="flex w-full md:w-auto items-center gap-3">
          <div className="relative w-full md:w-auto">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari catatan tindakan..."
              className="h-11 pl-9 pr-4 rounded-lg border border-gray-300 text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          {!isViewer && (
            <button
              onClick={() => setShowModal(true)}
              className="h-11 px-6 rounded-lg bg-green-700 text-white font-semibold text-sm hover:bg-green-800 transition-colors shrink-0"
            >
              Tambah Data
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-x-auto">
        <table className="w-full text-left border-collapse border border-gray-200">
          <thead>
            <tr className="bg-green-700 text-white">
              <th className="p-3 border border-gray-200 text-sm font-semibold">Minggu/Tanggal</th>
              <th className="p-3 border border-gray-200 text-sm font-semibold">Kondisi GH</th>
              <th className="p-3 border border-gray-200 text-sm font-semibold">Irigasi Tetes</th>
              <th className="p-3 border border-gray-200 text-sm font-semibold">Kondisi Tanaman</th>
              <th className="p-3 border border-gray-200 text-sm font-semibold">Hama/Penyakit</th>
              <th className="p-3 border border-gray-200 text-sm font-semibold">Pemupukan</th>
              <th className="p-3 border border-gray-200 text-sm font-semibold">Pembungaan/Pembuahan</th>
              <th className="p-3 border border-gray-200 text-sm font-semibold">Tindakan yang Dilakukan</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} className="p-6 text-center text-gray-500 border border-gray-200 text-base">Memuat data...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={8} className="p-6 text-center text-gray-500 italic border border-gray-200 text-base">Belum ada data yang cocok.</td></tr>
            ) : (
              data.map((row) => (
                <tr key={row.id} className="odd:bg-white even:bg-gray-50 text-gray-800 hover:bg-green-50 transition-colors">
                  <td className="p-3 border border-gray-200 text-base font-medium">{new Date(row.tanggal).toLocaleDateString('id-ID')}</td>
                  <td className="p-3 border border-gray-200 text-base">{labelMap[row.kondisi_gh]}</td>
                  <td className="p-3 border border-gray-200 text-base">{labelMap[row.irigasi_tetes]}</td>
                  <td className="p-3 border border-gray-200 text-base">{labelMap[row.kondisi_tanaman]}</td>
                  <td className="p-3 border border-gray-200 text-base">{labelMap[row.hama_penyakit]}</td>
                  <td className="p-3 border border-gray-200 text-base">{labelMap[row.pemupukan]}</td>
                  <td className="p-3 border border-gray-200 text-base">{labelMap[row.pembungaan_pembuahan]}</td>
                  <td className="p-3 border border-gray-200 text-base">{row.tindakan || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!isViewer && <AddGreenhouseModal open={showModal} onClose={() => setShowModal(false)} onSuccess={fetchData} />}
    </div>
  );
}