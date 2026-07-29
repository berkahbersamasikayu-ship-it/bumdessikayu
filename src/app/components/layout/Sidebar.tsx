'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import {
  Home,
  FilePlus,
  ClipboardList,
  LayoutGrid,
  Gauge,
  CircleDollarSign,
  FileClock,
  Users,
  LogOut,
} from 'lucide-react';

const menuItems = [
  { label: 'Dashboard', href: '/dashboard', icon: Home },
  { label: 'Input Transaksi', href: '/transaksi', icon: FilePlus },
  { label: 'Buku Kas', href: '/buku-kas', icon: ClipboardList },
  { label: 'Data Unit Usaha', href: '/unit-usaha', icon: LayoutGrid },
  { label: 'Monitoring', href: '/monitoring', icon: Gauge },
  { label: 'Data Penjualan', href: '/penjualan', icon: CircleDollarSign },
  { label: 'Log Aktivitas', href: '/log-aktivitas', icon: FileClock },
  { label: 'Manajemen Akun', href: '/akun', icon: Users },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const closeSidebar = () => setIsOpen(false);
  const toggleSidebar = () => setIsOpen((prev) => !prev);

  useEffect(() => {
    const syncSidebarState = () => {
      if (window.innerWidth >= 1025) setIsOpen(false);
    };
    syncSidebarState();
    window.addEventListener('resize', syncSidebarState);
    return () => window.removeEventListener('resize', syncSidebarState);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch (e) {
      console.error(e);
    } finally {
      router.push('/login');
    }
  };

  return (
    <>
      {/* Mobile hamburger toggle */}
      <button
        type="button"
        onClick={toggleSidebar}
        aria-label="Buka menu navigasi"
        className="lg:hidden fixed top-4 left-4 z-[60] flex flex-col justify-center gap-1 w-12 h-12 rounded-xl bg-white/95 shadow-sm border border-gray-200"
      >
        <span className="block w-5 h-0.5 mx-auto rounded-full bg-blue-900" />
        <span className="block w-5 h-0.5 mx-auto rounded-full bg-blue-900" />
        <span className="block w-5 h-0.5 mx-auto rounded-full bg-blue-900" />
      </button>

      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={closeSidebar}
          className="lg:hidden fixed inset-0 z-40 bg-slate-900/45 backdrop-blur-[2px]"
        />
      )}

      <aside
        className={`w-68 bg-white flex flex-col py-8 fixed top-0 left-0 bottom-0 h-screen border-r border-gray-100 z-50 transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 overflow-y-auto`}
      >
        <div className="mb-5 flex flex-col items-center w-full px-6 shrink-0">
          <div className="w-28 h-28 mb-3 relative"> 
            <Image 
              src="/logo.jpg" 
              alt="Logo BUMDes" 
              fill 
              className="object-contain" 
              priority
            />
          </div>
          <p className="text-[#1E3A8A] text-xl font-bold tracking-wide text-center">
            BUMDes Sikayu
          </p>
        </div>

        {/* Menu Navigasi (Diberi flex-1 agar memenuhi ruang sisa dan mendorong Logout ke bawah) */}
        <nav className="w-full px-6 flex flex-col gap-2 flex-1 mb-8" onClick={closeSidebar}>
          {menuItems.map(({ label, href, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-4 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'text-black font-bold bg-gray-50'
                    : 'text-black font-semibold hover:bg-gray-50'
                }`}
              >
                <Icon className="w-[1.6rem] h-[1.6rem] shrink-0" strokeWidth={2.2} />
                <span className="text-[1.15rem]">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout (Menggunakan mt-auto untuk nempel di bawah, bukan absolute) */}
        <div className="w-full mt-auto pt-4 pb-2 flex justify-center shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-3 text-black hover:text-red-600 font-bold text-[1.1rem] transition-colors"
          >
            <LogOut className="w-6 h-6 shrink-0" strokeWidth={2.5} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}