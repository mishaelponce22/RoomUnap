import { getAllListingsAdmin } from '@/app/actions/admin';
import AdminListingsClient from './AdminListingsClient';

export const metadata = {
  title: 'Gestión de Publicaciones - Admin',
};

export default async function AdminListingsPage() {
  const listings = await getAllListingsAdmin();

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 8px' }}>
          Gestión de Publicaciones
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 15, margin: 0 }}>
          Revisa y modera todas las habitaciones publicadas.
        </p>
      </div>

      <AdminListingsClient initialListings={listings} />
    </div>
  );
}
