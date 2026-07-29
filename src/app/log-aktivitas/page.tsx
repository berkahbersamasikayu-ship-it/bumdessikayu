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

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-x-auto">
        <table className="w-full text-left border-collapse border border-gray-200">
          <thead>
            <tr className="bg-green-700 text-white">
              <th className="p-3 border border-gray-200 text-sm font-semibold">No.</th>
              <th className="p-3 border border-gray-200 text-sm font-semibold">Waktu</th>
              <th className="p-3 border border-gray-200 text-sm font-semibold">User</th>
              <th className="p-3 border border-gray-200 text-sm font-semibold">Aksi</th>
              <th className="p-3 border border-gray-200 text-sm font-semibold">Detail</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-500 border border-gray-200 text-base">Memuat data...</td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-500 italic border border-gray-200 text-base">
                  Belum ada aktivitas tercatat.
                </td>
              </tr>
            ) : (
              data.map((log, idx) => (
                <tr key={idx} className="odd:bg-white even:bg-gray-50 text-gray-800 hover:bg-green-50 transition-colors">
                  <td className="p-3 border border-gray-200 text-base">{idx + 1}.</td>
                  <td className="p-3 border border-gray-200 text-base">{log.waktu}</td>
                  <td className="p-3 border border-gray-200 text-base font-medium text-gray-900">{log.user}</td>
                  <td className="p-3 border border-gray-200 text-base">{log.aksi}</td>
                  <td className="p-3 border border-gray-200 text-base">{log.detail}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}