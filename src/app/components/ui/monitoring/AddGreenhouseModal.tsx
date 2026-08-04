'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

function SelectGroup({
  label, value, onChange, options,
}: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-black mb-1.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 rounded-lg border border-gray-300 px-4 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
      >
        <option value="">Pilih {label}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

export default function AddGreenhouseModal({
  open, onClose, onSuccess,
}: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [tanggal, setTanggal] = useState('');
  const [kondisiGh, setKondisiGh] = useState('');
  const [irigasiTetes, setIrigasiTetes] = useState('');
  const [kondisiTanaman, setKondisiTanaman] = useState('');
  const [hamaPenyakit, setHamaPenyakit] = useState('');
  const [pemupukan, setPemupukan] = useState('');
  const [pembungaanPembuahan, setPembungaanPembuahan] = useState('');
  const [tindakan, setTindakan] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!open) return null;

  const resetAndClose = () => {
    setTanggal(''); setKondisiGh(''); setIrigasiTetes(''); setKondisiTanaman('');
    setHamaPenyakit(''); setPemupukan(''); setPembungaanPembuahan(''); setTindakan('');
    setErrorMessage(''); onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!tanggal || !kondisiGh || !irigasiTetes || !kondisiTanaman || !hamaPenyakit || !pemupukan || !pembungaanPembuahan) {
      setErrorMessage('Mohon lengkapi semua field yang wajib diisi.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/monitoring-greenhouse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tanggal, kondisiGh, irigasiTetes, kondisiTanaman,
          hamaPenyakit, pemupukan, pembungaanPembuahan, tindakan,
        }),
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
      <div className="bg-white rounded-2xl w-full max-w-xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button onClick={resetAndClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>
        <h3 className="text-lg font-bold text-black mb-5">Tambah Data Monitoring Greenhouse</h3>

        {errorMessage && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-black mb-1.5">Tanggal</label>
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              max={maxDate}
              className="w-full h-11 rounded-lg border border-gray-300 px-4 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          <SelectGroup label="Kondisi GH" value={kondisiGh} onChange={setKondisiGh} options={[
            { value: 'baik', label: 'Baik' },
            { value: 'perlu_dibersihkan', label: 'Perlu Dibersihkan' },
          ]} />

          <SelectGroup label="Irigasi Tetes" value={irigasiTetes} onChange={setIrigasiTetes} options={[
            { value: 'normal', label: 'Normal' },
            { value: 'bocor', label: 'Bocor' },
            { value: 'tersumbat', label: 'Tersumbat' },
          ]} />

          <SelectGroup label="Kondisi Tanaman" value={kondisiTanaman} onChange={setKondisiTanaman} options={[
            { value: 'sehat', label: 'Sehat' },
            { value: 'layu', label: 'Layu' },
            { value: 'mati', label: 'Mati' },
          ]} />

          <SelectGroup label="Hama/Penyakit" value={hamaPenyakit} onChange={setHamaPenyakit} options={[
            { value: 'tidak_ada', label: 'Tidak Ada' },
            { value: 'ada', label: 'Ada' },
          ]} />

          <SelectGroup label="Pemupukan" value={pemupukan} onChange={setPemupukan} options={[
            { value: 'sudah', label: 'Sudah' },
            { value: 'belum', label: 'Belum' },
          ]} />

          <SelectGroup label="Pembungaan/Pembuahan" value={pembungaanPembuahan} onChange={setPembungaanPembuahan} options={[
            { value: 'belum', label: 'Belum' },
            { value: 'berbunga', label: 'Berbunga' },
            { value: 'berbuah', label: 'Berbuah' },
          ]} />

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-black mb-1.5">
              Tindakan yang Dilakukan <span className="text-gray-400 font-normal">(opsional)</span>
            </label>
            <textarea
              value={tindakan}
              onChange={(e) => setTindakan(e.target.value)}
              rows={2}
              placeholder="Contoh: Membersihkan filter irigasi"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-700 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-900 resize-none"
            />
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