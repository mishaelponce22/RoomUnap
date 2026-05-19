import { getAllUsers } from '@/app/actions/admin';
import AdminUsersClient from './AdminUsersClient';

export const metadata = {
  title: 'Gestión de Usuarios - Admin',
};

export default async function AdminUsersPage() {
  const users = await getAllUsers();

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 8px' }}>
          Gestión de Usuarios
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 15, margin: 0 }}>
          Administra todas las cuentas registradas en la plataforma.
        </p>
      </div>

      <AdminUsersClient initialUsers={users} />
    </div>
  );
}
