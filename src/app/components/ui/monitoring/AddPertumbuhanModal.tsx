'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface Kolam { id: string; nama_kolam: string; }

export default function AddPertumbuhanModal({
  open, onClose, onSuccess,
}: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [kolamList, setKolamList] = useState<Kolam[]>([]);
  const [kolamId, setKolamId] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [beratRataRata, setBeratRataRata] = useState('');
  const [panjangRataRata, setPanjangRataRata] = useState('');
  const [jumlahIkanMati, setJumlahIkanMati] = useState('');
  const [ringkasanIkan, setRingkasanIkan] = useState<{ jumlahHidupSaatIni: number } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (open) {
      fetch('/api/kolam').then((res) => res.json()).then(setKolamList).catch(console.error);
    }
  }, [open]);

  useEffect(() => {
    if (kolamId) {
      fetch(`/api/kolam/${kolamId}/ringkasan`)
        .then((res) => res.json())
        .then((data) => setRingkasanIkan({ jumlahHidupSaatIni: data.jumlahHidupSaatIni }))
        .catch(() => setRingkasanIkan(null));
    } else {
      setRingkasanIkan(null);
    }
  }, [kolamId]);

  if (!open) return null;

  const jumlahHidupSetelahInput = ringkasanIkan
    ? ringkasanIkan.jumlahHidupSaatIni - (Number(jumlahIkanMati) || 0)
    : null;

  const biomassa =
    jumlahHidupSetelahInput !== null && jumlahHidupSetelahInput >= 0
      ? (jumlahHidupSetelahInput * (Number(beratRataRata) || 0)) / 1000
      : 0;

  const resetAndClose = () => {
    setKolamId(''); setTanggal(''); setBeratRataRata(''); setPanjangRataRata('');
    setJumlahIkanMati(''); setRingkasanIkan(null); setErrorMessage(''); onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!kolamId || !tanggal || !beratRataRata) {
      setErrorMessage('Mohon lengkapi field yang wajib diisi.');
      return;
    }

    if (jumlahHidupSetelahInput !== null && jumlahHidupSetelahInput < 0) {
      setErrorMessage('Jumlah kematian melebihi sisa ikan yang ada di kolam ini.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/monitoring-pertumbuhan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kolamId, tanggal, beratRataRata, panjangRataRata, jumlahIkanMati: jumlahIkanMati || 0 }),
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
        <h3 className="text-lg font-bold text-black mb-5">Tambah Data Monitoring Pertumbuhan</h3>

        {errorMessage && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-black mb-1.5">Kolam</label>
            <select value={kolamId} onChange={(e) => setKolamId(e.target.value)}
              className="w-full h-11 rounded-lg border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900">
              <option value="">Pilih Kolam</option>
              {kolamList.map((k) => <option key={k.id} value={k.id}>{k.nama_kolam}</option>)}
            </select>
            {ringkasanIkan && (
              <p className="text-xs text-gray-500 mt-1.5">
                Jumlah ikan hidup saat ini: <span className="font-semibold">{ringkasanIkan.jumlahHidupSaatIni} ekor</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-black mb-1.5">Tanggal</label>
            <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)}
              className="w-full h-11 rounded-lg border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-black mb-1.5">Jumlah Ikan Mati</label>
            <input type="number" value={jumlahIkanMati} onChange={(e) => setJumlahIkanMati(e.target.value)}
              placeholder="0"
              className="w-full h-11 rounded-lg border border-gray-300 px-4 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-900" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-black mb-1.5">Berat Rata-rata (gram)</label>
            <input type="number" value={beratRataRata} onChange={(e) => setBeratRataRata(e.target.value)}
              className="w-full h-11 rounded-lg border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-black mb-1.5">Panjang Rata-rata (cm)</label>
            <input type="number" value={panjangRataRata} onChange={(e) => setPanjangRataRata(e.target.value)}
              className="w-full h-11 rounded-lg border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900" />
          </div>

          {jumlahHidupSetelahInput !== null && (
            <div className="md:col-span-2 bg-green-50 border border-green-100 rounded-lg px-4 py-3 text-sm text-green-800 space-y-1">
              <p>Jumlah ikan hidup setelah ini: <span className="font-bold">{jumlahHidupSetelahInput} ekor</span></p>
              <p>Biomassa otomatis: <span className="font-bold">{biomassa.toFixed(2)} kg</span></p>
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