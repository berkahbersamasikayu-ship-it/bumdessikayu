import Sidebar from '../components/layout/Sidebar'; // Sesuaikan dengan path kamu

export default function BukuKasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <main className="lg:ml-64 p-4 pt-20 md:p-6 md:pt-24 lg:p-8 w-full overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}