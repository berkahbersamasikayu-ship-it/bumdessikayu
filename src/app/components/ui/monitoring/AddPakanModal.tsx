'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface Kolam { id: string; nama_kolam: string; }

export default function AddPakanModal({
  open, onClose, onSuccess,
}: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [kolamList, setKolamList] = useState<Kolam[]>([]);
  const [kolamId, setKolamId] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [jenisPakan, setJenisPakan] = useState('');
  const [jumlahPakan, setJumlahPakan] = useState('');
  const [jamPemberian, setJamPemberian] = useState('');
  const [sisaPakan, setSisaPakan] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (open) {
      fetch('/api/kolam').then((res) => res.json()).then(setKolamList).catch(console.error);
    }
  }, [open]);

  if (!open) return null;

  const resetAndClose = () => {
    setKolamId(''); setTanggal(''); setJenisPakan(''); setJumlahPakan('');
    setJamPemberian(''); setSisaPakan('');
    setErrorMessage(''); onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!kolamId || !tanggal || !jenisPakan || !jumlahPakan) {
      setErrorMessage('Mohon lengkapi field yang wajib diisi.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/monitoring-pakan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kolamId, tanggal, jenisPakan, jumlahPakan, jamPemberian, sisaPakan }),
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
        <h3 className="text-lg font-bold text-black mb-5">Tambah Data Monitoring Pakan</h3>

        {errorMessage && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-black mb-1.5">Kolam</label>
            <select value={kolamId} onChange={(e) => setKolamId(e.target.value)}
              className="w-full h-11 rounded-lg border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900">
              <option value="">Pilih Kolam</option>
              {kolamList.map((k) => <option key={k.id} value={k.id}>{k.nama_kolam}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-black mb-1.5">Tanggal</label>
            <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)}
              className="w-full h-11 rounded-lg border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-black mb-1.5">Jenis Pakan</label>
            <select value={jenisPakan} onChange={(e) => setJenisPakan(e.target.value)}
              className="w-full h-11 rounded-lg border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900">
              <option value="">Pilih Jenis Pakan</option>
              <option value="pelet">Pelet</option>
              <option value="maggot">Maggot</option>
              <option value="azolla">Azolla</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-black mb-1.5">Jumlah Pakan (kg)</label>
            <input type="number" step="0.01" value={jumlahPakan} onChange={(e) => setJumlahPakan(e.target.value)}
              className="w-full h-11 rounded-lg border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-black mb-1.5">Jam Pemberian</label>
            <input type="time" value={jamPemberian} onChange={(e) => setJamPemberian(e.target.value)}
              className="w-full h-11 rounded-lg border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-black mb-1.5">Sisa Pakan (kg)</label>
            <input type="number" step="0.01" value={sisaPakan} onChange={(e) => setSisaPakan(e.target.value)}
              className="w-full h-11 rounded-lg border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900" />
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