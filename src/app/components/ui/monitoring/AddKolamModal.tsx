'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

export default function AddKolamModal({
  open, onClose, onSuccess,
}: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [namaKolam, setNamaKolam] = useState('');
  const [luasKolam, setLuasKolam] = useState('');
  const [tanggalTebar, setTanggalTebar] = useState('');
  const [jumlahBenih, setJumlahBenih] = useState('');
  const [bobotRataRataAwal, setBobotRataRataAwal] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!open) return null;

  const biomassaAwal = ((Number(jumlahBenih) || 0) * (Number(bobotRataRataAwal) || 0)) / 1000;

  const resetAndClose = () => {
    setNamaKolam(''); setLuasKolam('');
    setTanggalTebar(''); setJumlahBenih(''); setBobotRataRataAwal('');
    setErrorMessage(''); onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!namaKolam || !tanggalTebar || !jumlahBenih || !bobotRataRataAwal) {
      setErrorMessage('Mohon lengkapi field yang wajib diisi.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/kolam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ namaKolam, luasKolam, tanggalTebar, jumlahBenih, bobotRataRataAwal }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      resetAndClose();
      onSuccess();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Gagal menyimpan data.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
        <button onClick={resetAndClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>
        <h3 className="text-lg font-bold text-black mb-5">Tambah Data Identitas Kolam</h3>

        {errorMessage && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-black mb-1.5">Nama Kolam</label>
            <input value={namaKolam} onChange={(e) => setNamaKolam(e.target.value)} placeholder="Contoh: Kolam A1"
              className="w-full h-11 rounded-lg border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-black mb-1.5">Luas Kolam (m²)</label>
            <input type="number" value={luasKolam} onChange={(e) => setLuasKolam(e.target.value)}
              className="w-full h-11 rounded-lg border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-black mb-1.5">Tanggal Tebar</label>
            <input type="date" value={tanggalTebar} onChange={(e) => setTanggalTebar(e.target.value)}
              className="w-full h-11 rounded-lg border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-black mb-1.5">Jumlah Benih (ekor)</label>
            <input type="number" value={jumlahBenih} onChange={(e) => setJumlahBenih(e.target.value)}
              className="w-full h-11 rounded-lg border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-black mb-1.5">Bobot Rata-rata Awal (gram)</label>
            <input type="number" value={bobotRataRataAwal} onChange={(e) => setBobotRataRataAwal(e.target.value)}
              className="w-full h-11 rounded-lg border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900" />
          </div>

          {biomassaAwal > 0 && (
            <div className="md:col-span-2 bg-green-50 border border-green-100 rounded-lg px-4 py-3 text-sm text-green-800">
              Biomassa awal otomatis: <span className="font-bold">{biomassaAwal.toFixed(2)} kg</span>
            </div>
          )}

          <div className="md:col-span-2 flex justify-end gap-3 mt-2">
            <button type="button" onClick={resetAndClose} disabled={isSaving}
              className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 disabled:opacity-50">
              Batal
            </button>
            <button type="submit" disabled={isSaving}
              className="px-5 py-2 rounded-lg bg-green-700 text-white font-semibold text-sm hover:bg-green-800 disabled:opacity-50">
              {isSaving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}