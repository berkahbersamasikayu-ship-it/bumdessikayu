import Sidebar from '../components/layout/Sidebar'; // Sesuaikan dengan path kamu

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <main className="lg:ml-64 p-4 md:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}