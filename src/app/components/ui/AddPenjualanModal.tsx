'use client';

import { useState, useEffect } from 'react';
import { X, Calendar } from 'lucide-react';
import CurrencyInput from './CurrencyInput';

interface UnitUsaha {
  id: string;
  nama: string;
}

export default function AddPenjualanModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [unitUsahaList, setUnitUsahaList] = useState<UnitUsaha[]>([]);
  const [tanggal, setTanggal] = useState('');
  const [unitUsahaId, setUnitUsahaId] = useState('');
  const [namaPembeli, setNamaPembeli] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [kuantitas, setKuantitas] = useState('');
  const [hargaPerKg, setHargaPerKg] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (open) {
      fetch('/api/unit-usaha/aktif')
        .then((res) => res.json())
        .then((data) => setUnitUsahaList(data))
        .catch((err) => console.error(err));
    }
  }, [open]);

  if (!open) return null;

  const totalHarga = (Number(kuantitas) || 0) * (Number(hargaPerKg) || 0);

  const resetAndClose = () => {
    setTanggal('');
    setUnitUsahaId('');
    setNamaPembeli('');
    setKeterangan('');
    setKuantitas('');
    setHargaPerKg('');
    setErrorMessage('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!tanggal || !unitUsahaId || !namaPembeli.trim() || !kuantitas || !hargaPerKg) {
      setErrorMessage('Mohon lengkapi semua field yang wajib diisi.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/penjualan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tanggal,
          unitUsahaId,
          namaPembeli,
          keterangan,
          kuantitas: Number(kuantitas),
          hargaPerKg: Number(hargaPerKg),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal menyimpan data penjualan.');

      resetAndClose();
      onSuccess();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Gagal menyimpan data penjualan.');
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

        <h3 className="text-2xl font-bold text-blue-700 mb-6">Tambah Data Penjualan</h3>

        {errorMessage && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-black mb-1.5">Tanggal Transaksi</label>
              <div className="relative">
                <input
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="w-full h-11 rounded-lg border border-gray-300 px-4 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
                <Calendar className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-black mb-1.5">Nama Pembeli</label>
              <input
                type="text"
                value={namaPembeli}
                onChange={(e) => setNamaPembeli(e.target.value)}
                placeholder="Masukkan Nama Pembeli"
                className="w-full h-11 rounded-lg border border-gray-300 px-4 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-black mb-1.5">Unit Usaha</label>
              <select
                value={unitUsahaId}
                onChange={(e) => setUnitUsahaId(e.target.value)}
                className="w-full h-11 rounded-lg border border-gray-300 px-4 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-900"
              >
                <option value="">Pilih Jenis Unit Usaha</option>
                {unitUsahaList.map((u) => (
                  <option key={u.id} value={u.id}>{u.nama}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-black mb-1.5">
                Keterangan <span className="text-gray-400 font-normal">(opsional)</span>
              </label>
              <input
                type="text"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Masukkan Keterangan"
                className="w-full h-11 rounded-lg border border-gray-300 px-4 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-black mb-1.5">Kuantitas (Kg)</label>
              <input
                type="number"
                value={kuantitas}
                onChange={(e) => setKuantitas(e.target.value)}
                placeholder="Masukkan Kuantitas"
                min={0}
                step="0.01"
                className="w-full h-11 rounded-lg border border-gray-300 px-4 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-black mb-1.5">Harga per Kg</label>
              <CurrencyInput
                value={hargaPerKg}
                onChange={setHargaPerKg}
                placeholder="Masukkan Harga per Kg"
                className="w-full h-11 rounded-lg border border-gray-300 px-4 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>
          </div>

          {totalHarga > 0 && (
            <div className="bg-green-50 border border-green-100 rounded-lg px-4 py-3 text-sm text-green-800">
              Total harga otomatis: <span className="font-bold">Rp{totalHarga.toLocaleString('id-ID')}</span>
            </div>
          )}

          <div className="flex justify-end mt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="px-8 py-3 rounded-lg bg-green-700 text-white font-bold text-sm hover:bg-green-800 disabled:opacity-50"
            >
              {isSaving ? 'Menyimpan...' : 'Tambah'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}