'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface Kolam { id: string; nama_kolam: string; }

export default function AddKualitasModal({
  open, onClose, onSuccess,
}: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [kolamList, setKolamList] = useState<Kolam[]>([]);
  const [kolamId, setKolamId] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [suhuAir, setSuhuAir] = useState('');
  const [ph, setPh] = useState('');
  const [doLevel, setDoLevel] = useState('');
  const [amonia, setAmonia] = useState('');
  const [kondisiIkan, setKondisiIkan] = useState('');
  const [nafsuMakan, setNafsuMakan] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (open) {
      fetch('/api/kolam/dropdown').then((res) => res.json()).then(setKolamList).catch(console.error);
    }
  }, [open]);

  if (!open) return null;

  const resetAndClose = () => {
    setKolamId(''); setTanggal(''); setSuhuAir(''); setPh(''); setDoLevel('');
    setAmonia(''); setKondisiIkan(''); setNafsuMakan(''); setErrorMessage(''); onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!kolamId || !tanggal) {
      setErrorMessage('Kolam dan tanggal wajib diisi.');
      return;
    }

    if ((Number(suhuAir) || 0) < 0 || (Number(ph) || 0) < 0 || (Number(doLevel) || 0) < 0 || (Number(amonia) || 0) < 0) {
      setErrorMessage('Angka tidak boleh bernilai minus.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/monitoring-kualitas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kolamId, tanggal, suhuAir, ph, doLevel, amonia, kondisiIkan, nafsuMakan }),
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

  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const maxDate = `${year}-${month}-${day}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
        <button onClick={resetAndClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>
        <h3 className="text-lg font-bold text-black mb-5">Tambah Data Monitoring Kualitas Budidaya</h3>

        {errorMessage && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-black mb-1.5">Kolam</label>
            <select value={kolamId} onChange={(e) => setKolamId(e.target.value)}
              className="w-full h-11 rounded-lg border border-gray-300 px-4 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-900">
              <option value="">Pilih Kolam</option>
              {kolamList.map((k) => <option key={k.id} value={k.id}>{k.nama_kolam}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-black mb-1.5">Tanggal</label>
            <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} max={maxDate}
              className="w-full h-11 rounded-lg border border-gray-300 px-4 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-900" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-black mb-1.5">Suhu Air (°C)</label>
            <input type="number" step="0.1" value={suhuAir} onChange={(e) => setSuhuAir(e.target.value)}
              min="0"
              className="w-full h-11 rounded-lg border border-gray-300 px-4 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-900" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-black mb-1.5">pH</label>
            <input type="number" step="0.1" value={ph} onChange={(e) => setPh(e.target.value)}
              min="0"
              className="w-full h-11 rounded-lg border border-gray-300 px-4 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-900" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-black mb-1.5">DO (opsional)</label>
            <input type="number" step="0.1" value={doLevel} onChange={(e) => setDoLevel(e.target.value)}
              min="0"
              className="w-full h-11 rounded-lg border border-gray-300 px-4 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-900" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-black mb-1.5">Amonia (opsional)</label>
            <input type="number" step="0.001" value={amonia} onChange={(e) => setAmonia(e.target.value)}
              min="0"
              className="w-full h-11 rounded-lg border border-gray-300 px-4 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-900" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-black mb-1.5">Kondisi Ikan</label>
            <select value={kondisiIkan} onChange={(e) => setKondisiIkan(e.target.value)}
              className="w-full h-11 rounded-lg border border-gray-300 px-4 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-900">
              <option value="">Pilih Kondisi</option>
              <option value="Sehat">Sehat</option>
              <option value="Waspada">Waspada</option>
              <option value="Sakit">Sakit</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-black mb-1.5">Nafsu Makan</label>
            <select value={nafsuMakan} onChange={(e) => setNafsuMakan(e.target.value)}
              className="w-full h-11 rounded-lg border border-gray-300 px-4 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-900">
              <option value="">Pilih Nafsu Makan</option>
              <option value="Baik">Baik</option>
              <option value="Menurun">Menurun</option>
              <option value="Buruk">Buruk</option>
            </select>
          </div>

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