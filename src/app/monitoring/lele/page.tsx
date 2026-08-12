// src/app/(dashboard)/monitoring/lele/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search } from 'lucide-react';
import AddKolamModal from '../../components/ui/monitoring/AddKolamModal';
import AddPakanModal from '../../components/ui/monitoring/AddPakanModal';
import AddPertumbuhanModal from '../../components/ui/monitoring/AddPertumbuhanModal';
import AddKualitasModal from '../../components/ui/monitoring/AddKualitasModal';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { FileSpreadsheet, FileText } from 'lucide-react';


type TabType = 'identitas' | 'pakan' | 'pertumbuhan' | 'kualitas';

export default function MonitoringLelePage() {
  const { isViewer } = useCurrentUser();
  const [tab, setTab] = useState<TabType>('identitas');
  const [search, setSearch] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const endpointMap: Record<TabType, string> = {
    identitas: '/api/kolam',
    pakan: '/api/monitoring-pakan',
    pertumbuhan: '/api/monitoring-pertumbuhan',
    kualitas: '/api/monitoring-kualitas',
  };

  const placeholderMap: Record<TabType, string> = {
    identitas: 'Cari nama kolam.',
    pakan: 'Cari nama kolam / jenis pakan...',
    pertumbuhan: 'Cari nama kolam...',
    kualitas: 'Cari nama kolam / kondisi ikan...',
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const res = await fetch(`${endpointMap[tab]}?${params.toString()}`);
      const payload = await res.json();

      if (!res.ok || !Array.isArray(payload)) {
        console.error('Gagal memuat data monitoring:', payload);
        setData([]);
        return;
      }

      setData(payload);
    } catch (err) {
      console.error(err);
      setData([]);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    setSearch('');
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchData();
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const jenisPakanLabel: Record<string, string> = { Pelet: 'Pelet', Maggot: 'Maggot' };

  const handleExport = (format: 'excel' | 'pdf') => {
    window.open(`${endpointMap[tab]}/export?format=${format}`, '_blank');
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-black mb-6">Monitoring Tambak Lele</h1>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <select
          value={tab}
          onChange={(e) => setTab(e.target.value as TabType)}
          className="h-11 w-full md:w-auto rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-900"
        >
          <option value="identitas">Data Identitas Kolam</option>
          <option value="pakan">Monitoring Pakan</option>
          <option value="pertumbuhan">Monitoring Pertumbuhan</option>
          <option value="kualitas">Monitoring Kualitas Budidaya</option>
        </select>

        <div className="flex flex-col md:flex-row w-full md:w-auto items-start md:items-center gap-3">
          <div className="relative w-full md:w-auto">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={placeholderMap[tab]}
              className="h-11 pl-9 pr-4 rounded-lg border border-gray-300 text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder-gray-500"
            />
          </div>

          <div className="flex w-full md:w-auto items-center gap-3">
            <button
              onClick={() => handleExport('excel')}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700"
            >
              <FileSpreadsheet size={16} />Export Excel
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-900 text-white text-sm font-semibold hover:bg-blue-800"
            >
              <FileText size={16} />Export PDF
            </button>

            {!isViewer && (
              <button
                onClick={() => setShowModal(true)}
                className="flex-1 md:flex-none h-11 px-6 rounded-lg bg-green-700 text-white font-semibold text-sm hover:bg-green-800 transition-colors shrink-0"
              >
                Tambah Data
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-x-auto">
        {tab === 'identitas' && (
          <>
            <h2 className="text-lg font-bold text-black mb-4">Data Identitas Kolam</h2>
            <table className="w-full text-left border-collapse border border-gray-200">
              <thead>
                <tr className="bg-green-700 text-white">
                  <th className="p-3 border border-gray-200 text-sm font-semibold">No.</th>
                  <th className="p-3 border border-gray-200 text-sm font-semibold">Nama Kolam</th>
                  <th className="p-3 border border-gray-200 text-sm font-semibold">Tanggal Tebar</th>
                  <th className="p-3 border border-gray-200 text-sm font-semibold">Umur Ikan</th>
                  <th className="p-3 border border-gray-200 text-sm font-semibold">Jumlah Benih</th>
                  <th className="p-3 border border-gray-200 text-sm font-semibold">Bobot Rata-rata Awal</th>
                  <th className="p-3 border border-gray-200 text-sm font-semibold">Biomassa Awal</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={7} className="p-6 text-center text-gray-500 border border-gray-200 text-base">Memuat data...</td></tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan={7} className="p-6 text-center text-gray-500 italic border border-gray-200 text-base">Belum ada data yang cocok.</td></tr>
                ) : (
                  data.map((k, idx) => {
                    const umurHari = Math.floor(
                      (new Date().getTime() - new Date(k.tanggal_tebar).getTime()) / (1000 * 60 * 60 * 24)
                    );
                    return (
                      <tr key={k.id} className="odd:bg-white even:bg-gray-50 text-gray-800 hover:bg-green-50 transition-colors">
                        <td className="p-3 border border-gray-200 text-base">{idx + 1}.</td>
                        <td className="p-3 border border-gray-200 text-base font-medium">{k.nama_kolam}</td>
                        <td className="p-3 border border-gray-200 text-base">{new Date(k.tanggal_tebar).toLocaleDateString('id-ID')}</td>
                        <td className="p-3 border border-gray-200 text-base">{umurHari} hari</td>
                        <td className="p-3 border border-gray-200 text-base">{k.jumlah_benih} ekor</td>
                        <td className="p-3 border border-gray-200 text-base">{k.bobot_rata_rata_awal} gram</td>
                        <td className="p-3 border border-gray-200 text-base">{Number(k.biomassa_awal).toFixed(2)} kg</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </>
        )}

        {tab === 'pakan' && (
          <>
            <h2 className="text-lg font-bold text-black mb-4">Data Monitoring Pakan</h2>
            <table className="w-full text-left border-collapse border border-gray-200">
              <thead>
                <tr className="bg-green-700 text-white">
                  <th className="p-3 border border-gray-200 text-sm font-semibold">No.</th>
                  <th className="p-3 border border-gray-200 text-sm font-semibold">Tanggal</th>
                  <th className="p-3 border border-gray-200 text-sm font-semibold">Kolam</th>
                  <th className="p-3 border border-gray-200 text-sm font-semibold">Jam Pemberian</th>
                  <th className="p-3 border border-gray-200 text-sm font-semibold">Jenis Pakan</th>
                  <th className="p-3 border border-gray-200 text-sm font-semibold">Jumlah Pakan</th>
                  <th className="p-3 border border-gray-200 text-sm font-semibold">Sisa Pakan</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={7} className="p-6 text-center text-gray-500 border border-gray-200 text-base">Memuat data...</td></tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan={7} className="p-6 text-center text-gray-500 italic border border-gray-200 text-base">Belum ada data yang cocok.</td></tr>
                ) : (
                  data.map((p, idx) => (
                    <tr key={p.id} className="odd:bg-white even:bg-gray-50 text-gray-800 hover:bg-green-50 transition-colors">
                      <td className="p-3 border border-gray-200 text-base">{idx + 1}.</td>
                      <td className="p-3 border border-gray-200 text-base">{new Date(p.tanggal).toLocaleDateString('id-ID')}</td>
                      <td className="p-3 border border-gray-200 text-base font-medium">{p.nama_kolam}</td>
                      <td className="p-3 border border-gray-200 text-base">{p.jam_pemberian || '-'}</td>
                      <td className="p-3 border border-gray-200 text-base">{jenisPakanLabel[p.jenis_pakan]}</td>
                      <td className="p-3 border border-gray-200 text-base">{Number(p.jumlah_pakan).toFixed(2)} kg</td>
                      <td className="p-3 border border-gray-200 text-base">{p.sisa_pakan ? Number(p.sisa_pakan).toFixed(2) + ' kg' : '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </>
        )}

        {tab === 'pertumbuhan' && (
          <>
            <h2 className="text-lg font-bold text-black mb-4">Data Monitoring Pertumbuhan</h2>
            <table className="w-full text-left border-collapse border border-gray-200">
              <thead>
                <tr className="bg-green-700 text-white">
                  <th className="p-3 border border-gray-200 text-sm font-semibold">No.</th>
                  <th className="p-3 border border-gray-200 text-sm font-semibold">Tanggal</th>
                  <th className="p-3 border border-gray-200 text-sm font-semibold">Nama Kolam</th>
                  <th className="p-3 border border-gray-200 text-sm font-semibold">Berat Rata-rata</th>
                  <th className="p-3 border border-gray-200 text-sm font-semibold">Panjang Rata-rata</th>
                  <th className="p-3 border border-gray-200 text-sm font-semibold text-center">Ikan Mati</th>
                  <th className="p-3 border border-gray-200 text-sm font-semibold text-center">Ikan Hidup</th>
                  <th className="p-3 border border-gray-200 text-sm font-semibold text-right">Biomassa</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={8} className="p-6 text-center text-gray-500 border border-gray-200 text-base">Memuat data...</td></tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan={8} className="p-6 text-center text-gray-500 italic border border-gray-200 text-base">Belum ada data yang cocok.</td></tr>
                ) : (
                  data.map((p, idx) => (
                    <tr key={p.id} className="odd:bg-white even:bg-gray-50 text-gray-800 hover:bg-green-50 transition-colors">
                      <td className="p-3 border border-gray-200 text-base">{idx + 1}.</td>
                      <td className="p-3 border border-gray-200 text-base">{new Date(p.tanggal).toLocaleDateString('id-ID')}</td>
                      <td className="p-3 border border-gray-200 text-base font-medium">{p.namaKolam}</td>
                      <td className="p-3 border border-gray-200 text-base">{p.beratRataRata} gram</td>
                      <td className="p-3 border border-gray-200 text-base">{p.panjangRataRata ? p.panjangRataRata + ' cm' : '-'}</td>
                      <td className="p-3 border border-gray-200 text-base text-red-600 text-center">{p.jumlahIkanMati} ekor</td>
                      <td className="p-3 border border-gray-200 text-base text-center">{p.jumlahIkanHidup} ekor</td>
                      <td className="p-3 border border-gray-200 text-base font-semibold text-green-700 text-right">{Number(p.biomassa ?? 0).toFixed(2)} kg</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </>
        )}

        {tab === 'kualitas' && (
          <>
            <h2 className="text-lg font-bold text-black mb-4">Data Monitoring Kualitas Budidaya</h2>
            <table className="w-full text-left border-collapse border border-gray-200">
              <thead>
                <tr className="bg-green-700 text-white">
                  <th className="p-3 border border-gray-200 text-sm font-semibold">No.</th>
                  <th className="p-3 border border-gray-200 text-sm font-semibold">Nama Kolam</th>
                  <th className="p-3 border border-gray-200 text-sm font-semibold text-center">Suhu Air</th>
                  <th className="p-3 border border-gray-200 text-sm font-semibold text-center">pH</th>
                  <th className="p-3 border border-gray-200 text-sm font-semibold text-center">DO</th>
                  <th className="p-3 border border-gray-200 text-sm font-semibold text-center">Amonia</th>
                  <th className="p-3 border border-gray-200 text-sm font-semibold">Kondisi Ikan</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={7} className="p-6 text-center text-gray-500 border border-gray-200 text-base">Memuat data...</td></tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan={7} className="p-6 text-center text-gray-500 italic border border-gray-200 text-base">Belum ada data yang cocok.</td></tr>
                ) : (
                  data.map((q, idx) => (
                    <tr key={q.id} className="odd:bg-white even:bg-gray-50 text-gray-800 hover:bg-green-50 transition-colors">
                      <td className="p-3 border border-gray-200 text-base">{idx + 1}.</td>
                      <td className="p-3 border border-gray-200 text-base font-medium">{q.nama_kolam}</td>
                      <td className="p-3 border border-gray-200 text-base text-center">{q.suhu_air ? q.suhu_air + ' °C' : '-'}</td>
                      <td className="p-3 border border-gray-200 text-base text-center">{q.ph ?? '-'}</td>
                      <td className="p-3 border border-gray-200 text-base text-center">{q.do_level ?? '-'}</td>
                      <td className="p-3 border border-gray-200 text-base text-center">{q.amonia ?? '-'}</td>
                      <td className="p-3 border border-gray-200 text-base">{q.kondisi_ikan || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </>
        )}
      </div>

      {!isViewer && (
        <>
          <AddKolamModal open={showModal && tab === 'identitas'} onClose={() => setShowModal(false)} onSuccess={fetchData} />
          <AddPakanModal open={showModal && tab === 'pakan'} onClose={() => setShowModal(false)} onSuccess={fetchData} />
          <AddPertumbuhanModal open={showModal && tab === 'pertumbuhan'} onClose={() => setShowModal(false)} onSuccess={fetchData} />
          <AddKualitasModal open={showModal && tab === 'kualitas'} onClose={() => setShowModal(false)} onSuccess={fetchData} />
        </>
      )}

    </div>
  );
}