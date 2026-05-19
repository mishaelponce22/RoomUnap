'use client';

import { useState, useTransition } from 'react';
import { deleteUser, updateUserRole } from '@/app/actions/admin';
import { Trash2, Shield, User as UserIcon, Loader2 } from 'lucide-react';
import type { User } from '@/lib/types/database';

export default function AdminUsersClient({ initialUsers }: { initialUsers: User[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [isPending, startTransition] = useTransition();

  async function handleDelete(userId: string) {
    if (!confirm('¿Estás seguro de que deseas eliminar permanentemente a este usuario? Esta acción no se puede deshacer.')) return;
    
    startTransition(async () => {
      try {
        await deleteUser(userId);
        setUsers(users.filter(u => u.id !== userId));
        alert('Usuario eliminado correctamente.');
      } catch (error: any) {
        alert(error.message);
      }
    });
  }

  async function handleRoleChange(userId: string, newRole: User['role']) {
    startTransition(async () => {
      try {
        await updateUserRole(userId, newRole);
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      } catch (error: any) {
        alert(error.message);
      }
    });
  }

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r-xl)', overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }}>
              <th style={{ padding: '16px 20px', fontSize: 13, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Usuario</th>
              <th style={{ padding: '16px 20px', fontSize: 13, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contacto</th>
              <th style={{ padding: '16px 20px', fontSize: 13, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rol</th>
              <th style={{ padding: '16px 20px', fontSize: 13, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} style={{ borderBottom: '1px solid var(--line)' }}>
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--surface-2)', display: 'grid', placeItems: 'center', color: 'var(--muted)' }}>
                      <UserIcon size={20} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{user.full_name}</div>
                      <div style={{ fontSize: 13, color: 'var(--muted-2)' }}>ID: {user.id.substring(0,8)}...</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ color: 'var(--ink)', fontSize: 14 }}>{user.email}</div>
                  <div style={{ color: 'var(--muted)', fontSize: 13 }}>{user.phone || 'Sin teléfono'}</div>
                </td>
                <td style={{ padding: '16px 20px' }}>
                  <select 
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value as User['role'])}
                    disabled={isPending}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 'var(--r-md)',
                      border: '1px solid var(--line-strong)',
                      background: 'var(--surface)',
                      fontSize: 14,
                      color: 'var(--ink)',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="estudiante">Estudiante</option>
                    <option value="arrendador">Arrendador</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </td>
                <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                  <button
                    onClick={() => handleDelete(user.id)}
                    disabled={isPending}
                    title="Eliminar usuario"
                    style={{
                      background: 'rgba(255,59,48,0.1)',
                      color: 'var(--danger)',
                      border: 'none',
                      padding: 8,
                      borderRadius: 8,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,59,48,0.15)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,59,48,0.1)'}
                  >
                    {isPending ? <Loader2 size={18} className="rmu-spin" /> : <Trash2 size={18} />}
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: 'var(--muted)' }}>
                  No hay usuarios registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
