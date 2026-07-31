'use client';

import { useEffect, useState } from 'react';

interface DataBulanan {
  bulan: number;
  namaBulan: string;
  tahun: number;
  pemasukan: number;
  pengeluaran: number;
  saldoBersih: number;
}

interface DataTahunan {
  tahun: number;
  pemasukan: number;
  pengeluaran: number;
  saldoBersih: number;
  sedangBerjalan: boolean;
}

function formatRupiah(value: number) {
  return 'Rp' + value.toLocaleString('id-ID');
}

export default function TransparansiPage() {
  const [mode, setMode] = useState<'bulanan' | 'tahunan'>('bulanan');
  const [tahunDipilih, setTahunDipilih] = useState(new Date().getFullYear());
  const [dataBulanan, setDataBulanan] = useState<DataBulanan[]>([]);
  const [dataTahunan, setDataTahunan] = useState<DataTahunan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const params = new URLSearchParams({ mode });
    if (mode === 'bulanan') params.set('tahun', tahunDipilih.toString());

    fetch(`/api/transparansi?${params.toString()}`)
      .then((res) => res.json())
      .then((json) => {
        if (mode === 'bulanan') setDataBulanan(json.data);
        else setDataTahunan(json.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, [mode, tahunDipilih]);

  const tahunSekarang = new Date().getFullYear();
  const daftarTahunPilihan = Array.from({ length: 5 }, (_, i) => tahunSekarang - i);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10 md:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-blue-900 mb-2">
            Transparansi Keuangan BUMDes Sikayu
          </h1>
          <p className="text-sm text-gray-500">
            Laporan pemasukan dan pengeluaran untuk periode yang sudah selesai
          </p>
        </div>

        <div className="flex justify-center gap-2 mb-6">
          <button
            onClick={() => setMode('bulanan')}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
              mode === 'bulanan' ? 'bg-blue-900 text-white' : 'bg-white text-gray-600 border border-gray-300'
            }`}
          >
            Per Bulan
          </button>
          <button
            onClick={() => setMode('tahunan')}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
              mode === 'tahunan' ? 'bg-blue-900 text-white' : 'bg-white text-gray-600 border border-gray-300'
            }`}
          >
            Per Tahun
          </button>
        </div>

        {mode === 'bulanan' && (
          <div className="flex justify-center mb-6">
            <select
              value={tahunDipilih}
              onChange={(e) => setTahunDipilih(Number(e.target.value))}
              className="h-10 rounded-lg border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
            >
              {daftarTahunPilihan.map((th) => (
                <option key={th} value={th}>{th}</option>
              ))}
            </select>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {isLoading ? (
            <p className="text-center text-gray-400 py-10">Memuat data...</p>
          ) : mode === 'bulanan' ? (
            dataBulanan.length === 0 ? (
              <p className="text-center text-gray-400 italic py-10">
                Belum ada laporan bulan yang selesai untuk tahun {tahunDipilih}.
              </p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-gray-700 border-b border-gray-200">
                    <th className="py-3 pr-3 font-semibold">Bulan</th>
                    <th className="py-3 pr-3 font-semibold text-right">Pemasukan</th>
                    <th className="py-3 pr-3 font-semibold text-right">Pengeluaran</th>
                    <th className="py-3 pr-3 font-semibold text-right">Saldo Bersih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {dataBulanan.map((d) => (
                    <tr key={d.bulan}>
                      <td className="py-3 pr-3 font-medium text-gray-900">{d.namaBulan} {d.tahun}</td>
                      <td className="py-3 pr-3 text-right text-green-700">{formatRupiah(d.pemasukan)}</td>
                      <td className="py-3 pr-3 text-right text-red-700">{formatRupiah(d.pengeluaran)}</td>
                      <td className="py-3 pr-3 text-right font-semibold text-blue-900">{formatRupiah(d.saldoBersih)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : dataTahunan.length === 0 ? (
            <p className="text-center text-gray-400 italic py-10">Belum ada data laporan.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-gray-700 border-b border-gray-200">
                  <th className="py-3 pr-3 font-semibold">Tahun</th>
                  <th className="py-3 pr-3 font-semibold text-right">Pemasukan</th>
                  <th className="py-3 pr-3 font-semibold text-right">Pengeluaran</th>
                  <th className="py-3 pr-3 font-semibold text-right">Saldo Bersih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dataTahunan.map((d) => (
                  <tr key={d.tahun}>
                    <td className="py-3 pr-3 font-medium text-gray-900">
                      {d.tahun}
                      {d.sedangBerjalan && (
                        <span className="ml-2 text-xs text-amber-600 font-normal">
                          (berjalan, hingga bulan selesai terakhir)
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-3 text-right text-green-700">{formatRupiah(d.pemasukan)}</td>
                    <td className="py-3 pr-3 text-right text-red-700">{formatRupiah(d.pengeluaran)}</td>
                    <td className="py-3 pr-3 text-right font-semibold text-blue-900">{formatRupiah(d.saldoBersih)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Data bulan/tahun yang masih berjalan belum ditampilkan untuk menjaga keakuratan laporan.
        </p>
      </div>
    </div>
  );
}