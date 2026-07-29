'use client';

import { useRouter } from 'next/navigation';
import { Fish, Sprout } from 'lucide-react';
import Image from 'next/image';

export default function MonitoringPage() {
  const router = useRouter();

  return (
    <div>
      <h1 className="text-3xl font-bold text-black mb-6">Monitoring</h1>
      <div className="flex flex-wrap gap-6">
        <button
          onClick={() => router.push('/monitoring/lele')}
          className="w-56 h-56 bg-white rounded-2xl shadow-sm border border-blue-300 hover:shadow-md transition-shadow flex flex-col items-center justify-center gap-3"
        >
          <div className="relative w-36 h-32"> 
            <Image 
              src="/lele.jpg" 
              alt="Ikon Tambak Lele" 
              fill
              className="object-contain" 
            />
          </div>
          <span className="text-lg font-bold text-black">Tambak Lele</span>
        </button>

        <button
          onClick={() => router.push('/monitoring/greenhouse')}
          className="w-56 h-56 bg-white rounded-2xl shadow-sm border border-green-300 hover:shadow-md transition-shadow flex flex-col items-center justify-center gap-3"
        >
          <Sprout size={125} className="text-green-500" strokeWidth={1.5} />
          <span className="text-lg font-bold text-black">Greenhouse</span>
        </button>
      </div>
    </div>
  );
}