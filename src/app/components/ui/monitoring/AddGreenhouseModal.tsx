'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

function RadioGroup({
  label,
  name,
  options,
  value,
  onChange,
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-black mb-1.5">{label}</label>
      <div className="flex flex-wrap gap-4">
        {options.map((opt) => (
          <label key={opt.value} className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
            <input
              type="radio"
              name={name}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              className="w-4 h-4 accent-green-700"
            />
            {opt.label}
          </label>
        ))}
      </div>
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-semibold text-black mb-1.5">Minggu/Tanggal</label>
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="w-full h-11 rounded-lg border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          <RadioGroup
            label="Kondisi GH"
            name="kondisiGh"
            value={kondisiGh}
            onChange={setKondisiGh}
            options={[
              { value: 'baik', label: 'Baik' },
              { value: 'perlu_dibersihkan', label: 'Perlu Dibersihkan' },
            ]}
          />

          <RadioGroup
            label="Irigasi Tetes"
            name="irigasiTetes"
            value={irigasiTetes}
            onChange={setIrigasiTetes}
            options={[
              { value: 'normal', label: 'Normal' },
              { value: 'bocor', label: 'Bocor' },
              { value: 'tersumbat', label: 'Tersumbat' },
            ]}
          />

          <RadioGroup
            label="Kondisi Tanaman"
            name="kondisiTanaman"
            value={kondisiTanaman}
            onChange={setKondisiTanaman}
            options={[
              { value: 'sehat', label: 'Sehat' },
              { value: 'layu', label: 'Layu' },
              { value: 'mati', label: 'Mati' },
            ]}
          />

          <RadioGroup
            label="Hama/Penyakit"
            name="hamaPenyakit"
            value={hamaPenyakit}
            onChange={setHamaPenyakit}
            options={[
              { value: 'tidak_ada', label: 'Tidak Ada' },
              { value: 'ada', label: 'Ada' },
            ]}
          />

          <RadioGroup
            label="Pemupukan"
            name="pemupukan"
            value={pemupukan}
            onChange={setPemupukan}
            options={[
              { value: 'sudah', label: 'Sudah' },
              { value: 'belum', label: 'Belum' },
            ]}
          />

          <RadioGroup
            label="Pembungaan/Pembuahan"
            name="pembungaanPembuahan"
            value={pembungaanPembuahan}
            onChange={setPembungaanPembuahan}
            options={[
              { value: 'belum', label: 'Belum' },
              { value: 'berbunga', label: 'Berbunga' },
              { value: 'berbuah', label: 'Berbuah' },
            ]}
          />

          <div>
            <label className="block text-sm font-semibold text-black mb-1.5">
              Tindakan yang Dilakukan <span className="text-gray-400 font-normal">(opsional)</span>
            </label>
            <textarea
              value={tindakan}
              onChange={(e) => setTindakan(e.target.value)}
              rows={2}
              placeholder="Contoh: Membersihkan filter irigasi"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-900 resize-none"
            />
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
              className="px-5 py-2 rounded-lg bg-green-700 text-white font-semibold text-sm hover:bg-green-800 disabled:opacity-50"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}