'use client';

import { useState, useEffect } from 'react';
import { X, Eye, EyeOff } from 'lucide-react'; // 1. Import ikon Eye dan EyeOff

interface AkunRow {
  id: string;
  nama: string;
  username: string;
}

export default function EditAkunModal({
  open,
  akun,
  onClose,
  onSuccess,
}: {
  open: boolean;
  akun: AkunRow | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [nama, setNama] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [konfirmasiPassword, setKonfirmasiPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // 2. State untuk mengontrol visibilitas password
  const [showPassword, setShowPassword] = useState(false);
  const [showKonfirmasiPassword, setShowKonfirmasiPassword] = useState(false);

  useEffect(() => {
    if (akun) {
      setNama(akun.nama);
      setUsername(akun.username);
      setPassword('');
      setKonfirmasiPassword('');
      setShowPassword(false); // Reset mata ke tertutup saat modal dibuka
      setShowKonfirmasiPassword(false);
    }
  }, [akun]);

  if (!open || !akun) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!nama.trim() || !username.trim()) {
      setErrorMessage('Nama dan username wajib diisi.');
      return;
    }

    if (password || konfirmasiPassword) {
      if (password.length < 6) {
        setErrorMessage('Password baru minimal 6 karakter.');
        return;
      }
      if (password !== konfirmasiPassword) {
        setErrorMessage('Konfirmasi password tidak cocok.');
        return;
      }
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/akun/${akun.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama, username }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal memperbarui akun.');

      if (password) {
        const resPw = await fetch(`/api/akun/${akun.id}/reset-password`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        });
        const dataPw = await resPw.json();
        if (!resPw.ok) throw new Error(dataPw.message || 'Gagal mereset password.');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Gagal menyimpan perubahan.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>

        <h3 className="text-lg font-bold text-black mb-5">Edit Akun</h3>

        {errorMessage && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold text-black mb-1.5">Nama</label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full h-11 rounded-lg border border-gray-300 px-4 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-black mb-1.5">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full h-11 rounded-lg border border-gray-300 px-4 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          <div className="border-t border-gray-100 pt-4 mt-1">
            <p className="text-xs text-gray-500 mb-3">
              Isi bagian ini hanya jika ingin mengganti password akun ini.
            </p>
            <div className="flex flex-col gap-3">
              
              {/* 3. Input Password Baru */}
              <div>
                <label className="block text-sm font-semibold text-black mb-1.5">Password Baru</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Kosongkan jika tidak diubah"
                    className="w-full h-11 rounded-lg border border-gray-300 pl-4 pr-10 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
              </div>

              {/* 4. Input Konfirmasi Password */}
              <div>
                <label className="block text-sm font-semibold text-black mb-1.5">Konfirmasi Password</label>
                <div className="relative">
                  <input
                    type={showKonfirmasiPassword ? "text" : "password"}
                    value={konfirmasiPassword}
                    onChange={(e) => setKonfirmasiPassword(e.target.value)}
                    placeholder="Ulangi password baru"
                    className="w-full h-11 rounded-lg border border-gray-300 pl-4 pr-10 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKonfirmasiPassword(!showKonfirmasiPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showKonfirmasiPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
              </div>

            </div>
          </div>

          <div className="flex justify-end gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-lg bg-blue-900 text-white font-semibold text-sm hover:bg-blue-800 disabled:opacity-50"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}