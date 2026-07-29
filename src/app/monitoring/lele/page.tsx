// src/app/(dashboard)/monitoring/lele/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search } from 'lucide-react';
import AddKolamModal from '../../components/ui/monitoring/AddKolamModal';
import AddPakanModal from '../../components/ui/monitoring/AddPakanModal';
import AddPertumbuhanModal from '../../components/ui/monitoring/AddPertumbuhanModal';
import AddKualitasModal from '../../components/ui/monitoring/AddKualitasModal';

type TabType = 'identitas' | 'pakan' | 'pertumbuhan' | 'kualitas';

export default function MonitoringLelePage() {
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
      setData(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // Ganti tab: reset search & fetch ulang
  useEffect(() => {
    setSearch('');
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // AJAX search dengan debounce
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchData();
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const jenisPakanLabel: Record<string, string> = { pelet: 'Pelet', maggot: 'Maggot', azolla: 'Azolla' };

  return (
    <div>
      <h1 className="text-2xl font-bold text-black mb-4">Monitoring Tambak Lele</h1>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <select
          value={tab}
          onChange={(e) => setTab(e.target.value as TabType)}
          className="h-11 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-900"
        >
          <option value="identitas">Data Identitas Kolam</option>
          <option value="pakan">Monitoring Pakan</option>
          <option value="pertumbuhan">Monitoring Pertumbuhan</option>
          <option value="kualitas">Monitoring Kualitas Budidaya</option>
        </select>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={placeholderMap[tab]}
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

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        {tab === 'identitas' && (
          <>
            <h2 className="text-lg font-bold text-black mb-4">Data Identitas Kolam</h2>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-gray-700 border-b border-gray-200">
                  <th className="py-3 pr-3 font-semibold">No.</th>
                  <th className="py-3 pr-3 font-semibold">Nama Kolam</th>
                  <th className="py-3 pr-3 font-semibold">Tanggal Tebar</th>
                  <th className="py-3 pr-3 font-semibold">Umur Ikan</th>
                  <th className="py-3 pr-3 font-semibold">Jumlah Benih</th>
                  <th className="py-3 pr-3 font-semibold">Bobot Rata-rata Awal</th>
                  <th className="py-3 pr-3 font-semibold">Biomassa Awal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td colSpan={7} className="py-8 text-center text-gray-400">Memuat data...</td></tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan={7} className="py-8 text-center text-gray-400 italic">Belum ada data yang cocok.</td></tr>
                ) : (
                  data.map((k, idx) => {
                    const umurHari = Math.floor(
                      (new Date().getTime() - new Date(k.tanggal_tebar).getTime()) / (1000 * 60 * 60 * 24)
                    );
                    return (
                      <tr key={k.id}>
                        <td className="py-3 pr-3">{idx + 1}.</td>
                        <td className="py-3 pr-3 font-medium">{k.nama_kolam}</td>
                        <td className="py-3 pr-3">{new Date(k.tanggal_tebar).toLocaleDateString('id-ID')}</td>
                        <td className="py-3 pr-3">{umurHari} hari</td>
                        <td className="py-3 pr-3">{k.jumlah_benih} ekor</td>
                        <td className="py-3 pr-3">{k.bobot_rata_rata_awal} gram</td>
                        <td className="py-3 pr-3">{Number(k.biomassa_awal).toFixed(2)} kg</td>
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
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-gray-700 border-b border-gray-200">
                  <th className="py-3 pr-3 font-semibold">No.</th>
                  <th className="py-3 pr-3 font-semibold">Tanggal</th>
                  <th className="py-3 pr-3 font-semibold">Kolam</th>
                  <th className="py-3 pr-3 font-semibold">Jam Pemberian</th>
                  <th className="py-3 pr-3 font-semibold">Jenis Pakan</th>
                  <th className="py-3 pr-3 font-semibold">Jumlah Pakan</th>
                  <th className="py-3 pr-3 font-semibold">Sisa Pakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td colSpan={7} className="py-8 text-center text-gray-400">Memuat data...</td></tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan={7} className="py-8 text-center text-gray-400 italic">Belum ada data yang cocok.</td></tr>
                ) : (
                  data.map((p, idx) => (
                    <tr key={p.id}>
                      <td className="py-3 pr-3">{idx + 1}.</td>
                      <td className="py-3 pr-3">{new Date(p.tanggal).toLocaleDateString('id-ID')}</td>
                      <td className="py-3 pr-3 font-medium">{p.nama_kolam}</td>
                      <td className="py-3 pr-3">{p.jam_pemberian || '-'}</td>
                      <td className="py-3 pr-3">{jenisPakanLabel[p.jenis_pakan]}</td>
                      <td className="py-3 pr-3">{Number(p.jumlah_pakan).toFixed(2)} kg</td>
                      <td className="py-3 pr-3">{p.sisa_pakan ? Number(p.sisa_pakan).toFixed(2) + ' kg' : '-'}</td>
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
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-gray-700 border-b border-gray-200">
                  <th className="py-3 pr-3 font-semibold">No.</th>
                  <th className="py-3 pr-3 font-semibold">Tanggal</th>
                  <th className="py-3 pr-3 font-semibold">Nama Kolam</th>
                  <th className="py-3 pr-3 font-semibold">Berat Rata-rata</th>
                  <th className="py-3 pr-3 font-semibold">Panjang Rata-rata</th>
                  <th className="py-3 pr-3 font-semibold">Ikan Mati</th>
                  <th className="py-3 pr-3 font-semibold">Ikan Hidup</th>
                  <th className="py-3 pr-3 font-semibold">Biomassa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td colSpan={8} className="py-8 text-center text-gray-400">Memuat data...</td></tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan={8} className="py-8 text-center text-gray-400 italic">Belum ada data yang cocok.</td></tr>
                ) : (
                  data.map((p, idx) => (
                    <tr key={p.id}>
                      <td className="py-3 pr-3">{idx + 1}.</td>
                      <td className="py-3 pr-3">{new Date(p.tanggal).toLocaleDateString('id-ID')}</td>
                      <td className="py-3 pr-3 font-medium">{p.namaKolam}</td>
                      <td className="py-3 pr-3">{p.beratRataRata} gram</td>
                      <td className="py-3 pr-3">{p.panjangRataRata ? p.panjangRataRata + ' cm' : '-'}</td>
                      <td className="py-3 pr-3 text-red-600">{p.jumlahIkanMati} ekor</td>
                      <td className="py-3 pr-3">{p.jumlahIkanHidup} ekor</td>
                      <td className="py-3 pr-3 font-semibold text-green-700">{p.biomassa.toFixed(2)} kg</td>
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
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-gray-700 border-b border-gray-200">
                  <th className="py-3 pr-3 font-semibold">No.</th>
                  <th className="py-3 pr-3 font-semibold">Nama Kolam</th>
                  <th className="py-3 pr-3 font-semibold">Suhu Air</th>
                  <th className="py-3 pr-3 font-semibold">pH</th>
                  <th className="py-3 pr-3 font-semibold">DO</th>
                  <th className="py-3 pr-3 font-semibold">Amonia</th>
                  <th className="py-3 pr-3 font-semibold">Kondisi Ikan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td colSpan={7} className="py-8 text-center text-gray-400">Memuat data...</td></tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan={7} className="py-8 text-center text-gray-400 italic">Belum ada data yang cocok.</td></tr>
                ) : (
                  data.map((q, idx) => (
                    <tr key={q.id}>
                      <td className="py-3 pr-3">{idx + 1}.</td>
                      <td className="py-3 pr-3 font-medium">{q.nama_kolam}</td>
                      <td className="py-3 pr-3">{q.suhu_air ? q.suhu_air + ' °C' : '-'}</td>
                      <td className="py-3 pr-3">{q.ph ?? '-'}</td>
                      <td className="py-3 pr-3">{q.do_level ?? '-'}</td>
                      <td className="py-3 pr-3">{q.amonia ?? '-'}</td>
                      <td className="py-3 pr-3">{q.kondisi_ikan || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </>
        )}
      </div>

      <AddKolamModal open={showModal && tab === 'identitas'} onClose={() => setShowModal(false)} onSuccess={fetchData} />
      <AddPakanModal open={showModal && tab === 'pakan'} onClose={() => setShowModal(false)} onSuccess={fetchData} />
      <AddPertumbuhanModal open={showModal && tab === 'pertumbuhan'} onClose={() => setShowModal(false)} onSuccess={fetchData} />
      <AddKualitasModal open={showModal && tab === 'kualitas'} onClose={() => setShowModal(false)} onSuccess={fetchData} />
    </div>
  );
}