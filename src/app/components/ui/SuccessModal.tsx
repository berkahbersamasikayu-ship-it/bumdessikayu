'use client';

import { CheckCircle2 } from 'lucide-react';

export default function SuccessModal({
  open,
  message,
  onClose,
}: {
  open: boolean;
  message: string;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl flex flex-col items-center text-center">
        <CheckCircle2 className="w-14 h-14 text-green-500 mb-3" strokeWidth={1.5} />
        <h3 className="text-lg font-bold text-black mb-1">Berhasil</h3>
        <p className="text-sm text-gray-600 mb-6">{message}</p>
        <button
          onClick={onClose}
          className="px-8 py-2.5 rounded-lg bg-blue-900 text-white font-semibold text-sm hover:bg-blue-800"
        >
          Oke
        </button>
      </div>
    </div>
  );
}