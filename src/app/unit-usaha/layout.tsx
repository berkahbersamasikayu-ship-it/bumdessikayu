import Sidebar from '../components/layout/Sidebar'; 

export default function UnitUsahaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 p-8 lg:ml-68">
        {children}
      </main>
    </div>
  );
}