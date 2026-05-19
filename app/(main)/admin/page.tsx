import { getAdminDashboardStats } from '@/app/actions/admin';
import { Users, Home, Activity } from 'lucide-react';

export const metadata = {
  title: 'Dashboard Admin - RoomUNAP',
};

export default async function AdminDashboard() {
  const stats = await getAdminDashboardStats();

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 8px' }}>
          Dashboard de Administración
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 15, margin: 0 }}>
          Resumen general de la plataforma.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
        {/* Tarjeta Usuarios */}
        <div style={{ 
          background: 'var(--surface)', 
          padding: 24, 
          borderRadius: 'var(--r-xl)', 
          border: '1px solid var(--line)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--muted)', margin: 0 }}>Usuarios Totales</h3>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(0,113,227,0.1)', display: 'grid', placeItems: 'center' }}>
              <Users size={20} color="var(--accent)" />
            </div>
          </div>
          <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--ink)' }}>
            {stats.totalUsers}
          </div>
        </div>

        {/* Tarjeta Publicaciones */}
        <div style={{ 
          background: 'var(--surface)', 
          padding: 24, 
          borderRadius: 'var(--r-xl)', 
          border: '1px solid var(--line)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--muted)', margin: 0 }}>Habitaciones</h3>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(52,199,89,0.1)', display: 'grid', placeItems: 'center' }}>
              <Home size={20} color="#34C759" />
            </div>
          </div>
          <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--ink)' }}>
            {stats.totalListings}
          </div>
        </div>

        {/* Tarjeta Actividad */}
        <div style={{ 
          background: 'var(--surface)', 
          padding: 24, 
          borderRadius: 'var(--r-xl)', 
          border: '1px solid var(--line)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--muted)', margin: 0 }}>Estado del Sistema</h3>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,149,0,0.1)', display: 'grid', placeItems: 'center' }}>
              <Activity size={20} color="#FF9500" />
            </div>
          </div>
          <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em', color: '#34C759', display: 'flex', alignItems: 'center', gap: 8, height: 43 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#34C759' }} />
            Operativo
          </div>
        </div>
      </div>
    </div>
  );
}
