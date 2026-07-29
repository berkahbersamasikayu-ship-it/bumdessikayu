// src/app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Login gagal.');
      }

      router.push('/dashboard');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Login gagal.');
      setPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-neutral-100 flex items-center justify-center overflow-hidden font-sans">
      <div className="w-full max-w-[550px] bg-white rounded-lg shadow-sm relative flex flex-col items-center py-8 px-8 md:px-10">
        <div className="mb-4">
          <img src="/logo.jpg" alt="Logo BUMDes" className="h-32 w-auto object-contain" />
        </div>

        <h1 className="text-blue-900 text-xl md:text-2xl font-bold text-center mb-1">
          BUMDES SIKAYU
        </h1>
        <h2 className="text-blue-900 text-xl font-semibold text-center mb-6">
          Login
        </h2>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="username" className="text-black text-base font-semibold">
              Username
            </label>
            <div className="w-full h-12 bg-white rounded-lg outline outline-1 outline-gray-200 flex items-center px-4 overflow-hidden focus-within:outline-blue-900 focus-within:outline-2 transition-all">
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border-none focus:ring-0 text-sm font-normal text-gray-700 bg-transparent placeholder-gray-400 outline-none"
                placeholder="Masukkan username"
                required
                autoFocus
              />
            </div>
          </div>

          <div className="flex flex-col gap-1 relative">
            <label htmlFor="password" className="text-black text-base font-semibold">
              Password
            </label>
            <div className="w-full h-12 bg-white rounded-lg outline outline-1 outline-gray-200 flex items-center px-4 overflow-hidden focus-within:outline-blue-900 focus-within:outline-2 transition-all">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-none focus:ring-0 text-sm font-normal text-gray-700 bg-transparent placeholder-gray-400 outline-none"
                placeholder="Masukkan password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="ml-2 text-gray-500 hover:text-blue-900 focus:outline-none"
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </div>
            {errorMessage && (
              <div className="text-red-500 text-xs mt-1">{errorMessage}</div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-14 mt-4 bg-blue-900 rounded-lg flex justify-center items-center gap-2 hover:bg-blue-800 transition-colors disabled:opacity-75"
          >
            <span className="text-neutral-100 text-sm font-bold leading-4">
              {isLoading ? 'Memproses...' : 'Log In'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}