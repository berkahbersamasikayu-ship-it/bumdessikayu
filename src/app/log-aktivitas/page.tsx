'use client';

import { useEffect, useState } from 'react';

interface LogRow {
  waktu: string;
  user: string;
  aksi: string;
  detail: string;
}

export default function LogAktivitasPage() {
  const [data, setData] = useState<LogRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/log-aktivitas')
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold text-black mb-6 ml-1">Log Aktivitas</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-gray-700 border-b border-gray-200">
              <th className="py-3 pr-3 font-semibold">No.</th>
              <th className="py-3 pr-3 font-semibold">Waktu</th>
              <th className="py-3 pr-3 font-semibold">User</th>
              <th className="py-3 pr-3 font-semibold">Aksi</th>
              <th className="py-3 pr-3 font-semibold">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-400">Memuat data...</td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-400 italic">
                  Belum ada aktivitas tercatat.
                </td>
              </tr>
            ) : (
              data.map((log, idx) => (
                <tr key={idx}>
                  <td className="py-3 pr-3 text-gray-700">{idx + 1}.</td>
                  <td className="py-3 pr-3 text-gray-700">{log.waktu}</td>
                  <td className="py-3 pr-3 text-gray-900 font-medium">{log.user}</td>
                  <td className="py-3 pr-3 text-gray-700">{log.aksi}</td>
                  <td className="py-3 pr-3 text-gray-700">{log.detail}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}