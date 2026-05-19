import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Users, LayoutDashboard, Home, Settings } from 'lucide-react';
import { verifySuperAdmin } from '@/app/actions/admin';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Verifica si es super_admin, si no, lo expulsa.
  try {
    await verifySuperAdmin();
  } catch (error) {
    redirect('/');
  }

  return (
    <main className="container-apple" style={{ paddingBlock: '40px', minHeight: 'calc(100vh - 64px)' }}>
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
            Panel Admin
          </h2>
          <Link 
            href="/"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--muted)', textDecoration: 'none', padding: '6px 12px', borderRadius: 'var(--r-pill)', background: 'var(--surface-2)' }}
          >
            <Settings size={14} /> Volver a la App
          </Link>
        </div>
        
        <div className="admin-nav chips" style={{ paddingBottom: 16, borderBottom: '1px solid var(--line)', margin: 0 }}>
          <AdminNavLink href="/admin" icon={<LayoutDashboard size={16} />} label="Dashboard" />
          <AdminNavLink href="/admin/users" icon={<Users size={16} />} label="Usuarios" />
          <AdminNavLink href="/admin/listings" icon={<Home size={16} />} label="Publicaciones" />
        </div>
      </div>

      <div className="admin-content">
        {children}
      </div>
    </main>
  );
}

function AdminNavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <>
      <Link 
        href={href}
        className="chip admin-nav-chip"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 14,
          fontWeight: 500,
          textDecoration: 'none'
        }}
      >
        <span style={{ display: 'flex' }}>{icon}</span>
        {label}
      </Link>
      <style>{`
        .admin-nav-chip:hover {
          background: var(--ink) !important;
          color: white !important;
          border-color: var(--ink) !important;
        }
      `}</style>
    </>
  );
}
