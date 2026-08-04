// src/app/(dashboard)/transaksi/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Calendar, Loader2 } from 'lucide-react';
import ConfirmModal from '../components/ui/ConfirmModal';
import SuccessModal from '../components/ui/SuccessModal';
import { compressImage } from '@/lib/compress-image';
import CurrencyInput from '../components/ui/CurrencyInput';
import { useCurrentUser } from '@/lib/useCurrentUser';

interface UnitUsaha {
  id: string;
  nama: string;
}

export default function InputTransaksiPage() {
  const { isViewer, isLoading: isLoadingUser } = useCurrentUser();
  const [unitUsahaList, setUnitUsahaList] = useState<UnitUsaha[]>([]);

  const [tanggal, setTanggal] = useState('');
  const [jenis, setJenis] = useState('');
  const [unitUsahaId, setUnitUsahaId] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [nominal, setNominal] = useState('');
  const [buktiFile, setBuktiFile] = useState<File | null>(null);
  const [buktiPreviewSize, setBuktiPreviewSize] = useState<{ before: number; after: number } | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetch('/api/unit-usaha/aktif')
      .then((res) => res.json())
      .then((data) => setUnitUsahaList(data))
      .catch((err) => console.error(err));
  }, []);

  const resetForm = () => {
    setTanggal('');
    setJenis('');
    setUnitUsahaId('');
    setKeterangan('');
    setNominal('');
    setBuktiFile(null);
    setBuktiPreviewSize(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage('');

    // Validasi tipe file
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage('Format file harus JPG, PNG, WEBP, atau PDF.');
      return;
    }

    // Validasi ukuran maksimal sebelum kompresi (misal 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Ukuran file maksimal 10MB.');
      return;
    }

    const originalSize = file.size;

    if (file.type.startsWith('image/')) {
      setIsCompressing(true);
      const compressed = await compressImage(file);
      setBuktiFile(compressed);
      setBuktiPreviewSize({ before: originalSize, after: compressed.size });
      setIsCompressing(false);
    } else {
      setBuktiFile(file);
      setBuktiPreviewSize(null);
    }
  };

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!tanggal || !jenis || !unitUsahaId || !keterangan || !nominal) {
      setErrorMessage('Mohon lengkapi semua field yang wajib diisi.');
      return;
    }

    setShowConfirm(true);
  };

  const handleSaveTransaksi = async () => {
    setIsSaving(true);
    setErrorMessage('');

    try {
      let buktiFileUrl = null;

      if (buktiFile) {
        const formData = new FormData();
        formData.append('file', buktiFile);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const uploadData = await uploadRes.json();

        if (!uploadRes.ok) {
          throw new Error(uploadData.message || 'Gagal upload bukti.');
        }

        buktiFileUrl = uploadData.url;
      }

      const res = await fetch('/api/transaksi', {
        method: 'POST',
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

      if (!res.ok) {
        throw new Error(data.message || 'Gagal menyimpan transaksi.');
      }

      setShowConfirm(false);
      setShowSuccess(true);
    } catch (err) {
      setShowConfirm(false);
      setErrorMessage(err instanceof Error ? err.message : 'Gagal menyimpan transaksi.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
    resetForm();
  };

  const formatKB = (bytes: number) => `${(bytes / 1024).toFixed(0)} KB`;

  if (isLoadingUser) return null;

  if (isViewer) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-gray-500">Akun viewer hanya dapat melihat data, tidak dapat menambah transaksi.</p>
      </div>
    );
  }

  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const maxDate = `${year}-${month}-${day}`;

  return (
    <div className="flex justify-center">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-4xl">
        <h1 className="text-3xl font-bold text-blue-800 mb-6">Form Input Transaksi</h1>

        {errorMessage && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleOpenConfirm} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-semibold text-black mb-1.5">
              Tanggal Transaksi
            </label>
            <div className="relative">
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                max={maxDate}
                className="w-full h-11 rounded-lg border border-gray-300 px-4 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-black mb-1.5">
                Jenis Transaksi
              </label>
              <select
                value={jenis}
                onChange={(e) => setJenis(e.target.value)}
                className="w-full h-11 rounded-lg border border-gray-300 px-4 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-900"
              >
                <option value="">Pilih Jenis Transaksi</option>
                <option value="Pemasukan">Pemasukan</option>
                <option value="Pengeluaran">Pengeluaran</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-black mb-1.5">
                Unit Usaha
              </label>
              <select
                value={unitUsahaId}
                onChange={(e) => setUnitUsahaId(e.target.value)}
                className="w-full h-11 rounded-lg border border-gray-300 px-4 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-900"
              >
                <option value="">Pilih Jenis Unit Usaha</option>
                {unitUsahaList.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nama}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-black mb-1.5">
                Keterangan
              </label>
              <input
                type="text"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Tulis Keterangan"
                className="w-full h-11 rounded-lg border border-gray-300 px-4 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-black mb-1.5">
                Nominal
              </label>
              <CurrencyInput
                value={nominal}
                onChange={setNominal}
                placeholder="Masukkan nominal"
                className="w-full h-11 rounded-lg border border-gray-300 px-4 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-black mb-1.5">
              Bukti Transaksi (Opsional)
            </label>
            <label className="inline-flex items-center gap-2 h-11 px-5 rounded-lg border border-gray-300 text-sm text-gray-600 cursor-pointer hover:bg-gray-50 w-fit">
              {isCompressing && <Loader2 className="w-4 h-4 animate-spin" />}
              {isCompressing ? 'Mengompres gambar...' : buktiFile ? buktiFile.name : 'Pilih File'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="hidden"
                onChange={handleFileChange}
                disabled={isCompressing}
              />
            </label>

            {buktiPreviewSize && (
              <p className="text-xs text-gray-500 mt-1.5">
                Ukuran dikompres dari {formatKB(buktiPreviewSize.before)} menjadi{' '}
                <span className="text-green-600 font-medium">{formatKB(buktiPreviewSize.after)}</span>
              </p>
            )}
          </div>

          <div className="flex justify-end mt-4">
            <button
              type="submit"
              disabled={isCompressing}
              className="px-8 py-4 rounded-lg bg-green-600 text-white font-bold text-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              Simpan
            </button>
          </div>
        </form>
      </div>

      <ConfirmModal
        open={showConfirm}
        title="Konfirmasi Penyimpanan"
        message="Apakah Anda yakin ingin menyimpan transaksi ini? Pastikan data yang diisi sudah benar."
        onConfirm={handleSaveTransaksi}
        onCancel={() => setShowConfirm(false)}
        isLoading={isSaving}
      />

      <SuccessModal
        open={showSuccess}
        message="Transaksi berhasil disimpan ke dalam sistem."
        onClose={handleCloseSuccess}
      />
    </div>
  );
}