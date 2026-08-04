'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import CurrencyInput from './CurrencyInput';

interface UnitUsaha { id: string; nama: string; }

export default function EditTransaksiModal({
  open,
  noTransaksi,
  onClose,
  onSuccess,
}: {
  open: boolean;
  noTransaksi: string | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [unitUsahaList, setUnitUsahaList] = useState<UnitUsaha[]>([]);
  const [tanggal, setTanggal] = useState('');
  const [jenis, setJenis] = useState('');
  const [unitUsahaId, setUnitUsahaId] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [nominal, setNominal] = useState('');
  const [buktiFileUrl, setBuktiFileUrl] = useState<string | null>(null);

  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (open) {
      fetch('/api/unit-usaha')
        .then((res) => res.json())
        .then((data) => setUnitUsahaList(data))
        .catch(console.error);
    }
  }, [open]);

  useEffect(() => {
    if (open && noTransaksi) {
      setIsLoadingDetail(true);
      setErrorMessage('');
      fetch(`/api/transaksi/${noTransaksi}`)
        .then((res) => res.json())
        .then((data) => {
          setTanggal(data.tanggal);
          setJenis(data.jenis);
          setUnitUsahaId(data.unitUsahaId);
          setKeterangan(data.keterangan);
          setNominal(String(data.nominal));
          setBuktiFileUrl(data.buktiFileUrl);
        })
        .catch(() => setErrorMessage('Gagal memuat detail transaksi.'))
        .finally(() => setIsLoadingDetail(false));
    }
  }, [open, noTransaksi]);

  if (!open || !noTransaksi) return null;

  const resetAndClose = () => {
    setTanggal(''); setJenis(''); setUnitUsahaId(''); setKeterangan('');
    setNominal(''); setBuktiFileUrl(null); setErrorMessage('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!tanggal || !jenis || !unitUsahaId || !keterangan || !nominal) {
      setErrorMessage('Mohon lengkapi semua field yang wajib diisi.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/transaksi/${noTransaksi}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tanggal,
          jenis,
          unitUsahaId,
          keterangan,
          nominal: Number(nominal),
          buktiFileUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal menyimpan perubahan.');

      resetAndClose();
      onSuccess();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Gagal menyimpan perubahan.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl p-8 shadow-2xl relative">
        <button onClick={resetAndClose} className="absolute top-5 right-5 text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>

        <h3 className="text-2xl font-bold text-blue-700 mb-1">Edit Transaksi</h3>
        <p className="text-sm text-gray-500 mb-6">{noTransaksi}</p>

        {errorMessage && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2">
            {errorMessage}
          </div>
        )}

        {isLoadingDetail ? (
          <p className="text-sm text-gray-400 py-8 text-center">Memuat data transaksi...</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-semibold text-black mb-1.5">Tanggal Transaksi</label>
              <div className="relative">
                <input
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="w-full h-11 rounded-lg border border-gray-300 px-4 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-black mb-1.5">Jenis Transaksi</label>
                <select
                  value={jenis}
                  onChange={(e) => setJenis(e.target.value)}
                  className="w-full h-11 rounded-lg border border-gray-300 px-4 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-900"
                >
                  <option value="Pemasukan">Pemasukan</option>
                  <option value="Pengeluaran">Pengeluaran</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-1.5">Unit Usaha</label>
                <select
                  value={unitUsahaId}
                  onChange={(e) => setUnitUsahaId(e.target.value)}
                  className="w-full h-11 rounded-lg border border-gray-300 px-4 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-900"
                >
                  {unitUsahaList.map((u) => (
                    <option key={u.id} value={u.id}>{u.nama}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-black mb-1.5">Keterangan</label>
                <input
                  type="text"
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  className="w-full h-11 rounded-lg border border-gray-300 px-4 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-1.5">Nominal</label>
                <CurrencyInput
                  value={nominal}
                  onChange={setNominal}
                  className="w-full h-11 rounded-lg border border-gray-300 px-4 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>
            </div>

            {buktiFileUrl && (
              <div>
                <label className="block text-sm font-semibold text-black mb-1.5">Bukti Saat Ini</label>
                <a href={buktiFileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-700 text-sm hover:underline">
                  Lihat bukti transaksi
                </a>
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-100 rounded-lg px-4 py-3 text-xs text-yellow-800">
              Mengubah tanggal atau nominal akan menghitung ulang saldo berjalan pada semua transaksi terkait di Buku Kas.
            </div>

            <div className="flex justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={resetAndClose}
                disabled={isSaving}
                className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-8 py-2.5 rounded-lg bg-blue-900 text-white font-bold text-sm hover:bg-blue-800 disabled:opacity-50"
              >
                {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}