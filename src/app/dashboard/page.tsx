// src/app/(dashboard)/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  Wallet, TrendingUp, TrendingDown, Receipt,
  Fish, Sprout, Package, Warehouse, Leaf, Building2,
} from 'lucide-react';

interface DashboardData {
  userName: string;
  saldoKas: number;
  pemasukanBulanIni: number;
  pengeluaranBulanIni: number;
  jumlahTransaksi: number;
  saldoPerUnit: { nama: string; saldo: number }[];
  grafikBulanan: { bulan: string; pemasukan: number; pengeluaran: number }[];
  transaksiTerakhir: { keterangan: string; tanggal: string; nominal: number; jenis: 'Pemasukan' | 'Pengeluaran' }[];
}

function formatRupiah(value: number) {
  return 'Rp' + value.toLocaleString('id-ID');
}

// Palet warna + ikon untuk card saldo per unit usaha — berputar otomatis sesuai urutan unit usaha
const unitCardStyles = [
  { border: 'border-sky-400', iconBg: 'bg-sky-100', iconColor: 'text-sky-500', Icon: Fish },
  { border: 'border-green-600', iconBg: 'bg-green-100', iconColor: 'text-green-600', Icon: Sprout },
  { border: 'border-orange-400', iconBg: 'bg-orange-100', iconColor: 'text-orange-500', Icon: Package },
  { border: 'border-purple-400', iconBg: 'bg-purple-100', iconColor: 'text-purple-500', Icon: Warehouse },
  { border: 'border-teal-400', iconBg: 'bg-teal-100', iconColor: 'text-teal-500', Icon: Leaf },
  { border: 'border-amber-400', iconBg: 'bg-amber-100', iconColor: 'text-amber-500', Icon: Building2 },
];

function getUnitCardStyle(index: number) {
  return unitCardStyles[index % unitCardStyles.length];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <div className="text-center py-10 text-gray-500">Memuat dashboard...</div>;
  }

  if (!data) {
    return <div className="text-center py-10 text-red-500">Gagal memuat data dashboard.</div>;
  }

  const maxValue = Math.max(
    ...data.grafikBulanan.flatMap((d) => [d.pemasukan, d.pengeluaran]),
    1
  );

  // Grid dinamis: maksimal 3 kolom, tapi kalau jumlah card < 3, kolom menyesuaikan jumlahnya
  // supaya 1 card = lebar penuh, 2 card = 2 kolom, 3+ card = 3 kolom lalu wrap ke baris baru
  const jumlahUnit = data.saldoPerUnit.length;
  const jumlahKolom = Math.min(jumlahUnit, 3) || 1;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8 text-black">Selamat Datang, {data.userName}</h1>

      {/* Metric cards baris 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <MetricCard
          label="Saldo Kas"
          value={formatRupiah(data.saldoKas)}
          borderColor="border-indigo-800"
          iconBg="bg-indigo-100"
          iconColor="text-indigo-600"
          Icon={Wallet}
        />
        <MetricCard
          label="Pemasukan Bulan Ini"
          value={formatRupiah(data.pemasukanBulanIni)}
          borderColor="border-green-500"
          iconBg="bg-green-100"
          iconColor="text-green-600"
          Icon={TrendingUp}
        />
        <MetricCard
          label="Pengeluaran Bulan Ini"
          value={formatRupiah(data.pengeluaranBulanIni)}
          borderColor="border-red-500"
          iconBg="bg-red-100"
          iconColor="text-red-500"
          Icon={TrendingDown}
        />
        <MetricCard
          label="Jumlah Transaksi"
          value={data.jumlahTransaksi.toString()}
          borderColor="border-purple-500"
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
          Icon={Receipt}
        />
      </div>

      {/* Saldo per unit usaha — grid dinamis, maks 3 kolom */}
      {jumlahUnit > 0 && (
        <div
          className="grid gap-6 mb-8"
          style={{ gridTemplateColumns: `repeat(${jumlahKolom}, minmax(0, 1fr))` }}
        >
          {data.saldoPerUnit.map((unit, idx) => {
            const style = getUnitCardStyle(idx);
            return (
              <MetricCard
                key={unit.nama}
                label={`Saldo Unit ${unit.nama}`}
                value={formatRupiah(unit.saldo)}
                borderColor={style.border}
                iconBg={style.iconBg}
                iconColor={style.iconColor}
                Icon={style.Icon}
                compact
              />
            );
          })}
        </div>
      )}

      {/* Grafik + Transaksi Terakhir */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="bg-white rounded-2xl shadow-sm border border-green-500 p-6">
          <h2 className="text-lg font-bold text-black mb-4">Pemasukan vs Pengeluaran (6 bulan)</h2>
          <div className="flex items-end gap-3 h-40">
            {data.grafikBulanan.map((d) => (
              <div key={d.bulan} className="flex flex-col items-center gap-1 flex-1">
                <div className="flex items-end gap-1 h-32 w-full justify-center">
                  <div
                    className="w-4 bg-green-500 rounded-sm"
                    style={{ height: `${(d.pemasukan / maxValue) * 100}%` }}
                  />
                  <div
                    className="w-4 bg-red-500 rounded-sm"
                    style={{ height: `${(d.pengeluaran / maxValue) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-gray-500">{d.bulan}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-3 text-xs text-gray-600">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-green-500 rounded-sm inline-block" /> Pemasukan
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-red-500 rounded-sm inline-block" /> Pengeluaran
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-indigo-500 p-6">
          <h2 className="text-lg font-bold text-black mb-4">Transaksi Terakhir</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-gray-200">
              <thead>
                <tr className="bg-blue-800 text-white">
                  <th className="p-3 border border-gray-200 font-semibold">Transaksi</th>
                  <th className="p-3 border border-gray-200 font-semibold">Tanggal</th>
                  <th className="p-3 border border-gray-200 font-semibold text-right">Nominal</th>
                </tr>
              </thead>
              <tbody>
                {data.transaksiTerakhir.map((t, idx) => (
                  <tr key={idx} className="odd:bg-white even:bg-gray-50 text-gray-700 hover:bg-blue-50 transition-colors">
                    <td className="p-3 border border-gray-200 text-sm">{t.keterangan}</td>
                    <td className="p-3 border border-gray-200 text-sm">{t.tanggal}</td>
                    <td
                      className={`p-3 border border-gray-200 text-sm font-semibold text-right ${
                        t.jenis === 'Pemasukan' ? 'text-green-700' : 'text-red-600'
                      }`}
                    >
                      {t.jenis === 'Pemasukan' ? '+' : '-'}Rp{t.nominal.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  borderColor,
  iconBg,
  iconColor,
  Icon,
  compact,
}: {
  label: string;
  value: string;
  borderColor: string;
  iconBg: string;
  iconColor: string;
  Icon: React.ElementType;
  compact?: boolean;
}) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border-l-8 ${borderColor} border-t border-r border-b border-gray-100 p-4 xl:p-5 relative flex flex-col justify-between overflow-hidden ${
        compact ? 'h-24' : 'h-32'
      }`}
    >
      {/* Tambahan pr-10 untuk mobile, font dibuat adaptif (kecil di HP, membesar otomatis di layar lebar) */}
      <div className="pr-10 md:pr-12 h-full flex flex-col justify-between">
        <h3 className={`text-black font-semibold ${compact ? 'text-xs sm:text-sm' : 'text-sm xl:text-base'}`}>
          {label}
        </h3>
        <span className={`font-bold text-black leading-none block tracking-tight whitespace-nowrap ${compact ? 'text-base sm:text-lg' : 'text-lg sm:text-xl'}`}>
          {value}
        </span>
      </div>
      
      <div className={`absolute bottom-4 right-4 ${compact ? 'w-8 h-8' : 'w-10 h-10'} ${iconBg} rounded-full flex items-center justify-center`}>
        <Icon className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} ${iconColor}`} strokeWidth={2} />
      </div>
    </div>
  );
}