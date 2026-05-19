'use client';

import { useState, useTransition } from 'react';
import { updateListingStatus, deleteListingAdmin } from '@/app/actions/admin';
import { Trash2, ExternalLink, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function AdminListingsClient({ initialListings }: { initialListings: any[] }) {
  const [listings, setListings] = useState(initialListings);
  const [isPending, startTransition] = useTransition();

  async function handleDelete(listingId: string) {
    if (!confirm('¿Seguro que deseas eliminar esta publicación permanentemente?')) return;
    
    startTransition(async () => {
      try {
        await deleteListingAdmin(listingId);
        setListings(listings.filter(l => l.id !== listingId));
        alert('Publicación eliminada correctamente.');
      } catch (error: any) {
        alert(error.message);
      }
    });
  }

  async function handleStatusChange(listingId: string, newStatus: 'active' | 'inactive' | 'rented') {
    startTransition(async () => {
      try {
        await updateListingStatus(listingId, newStatus);
        setListings(listings.map(l => l.id === listingId ? { ...l, status: newStatus } : l));
      } catch (error: any) {
        alert(error.message);
      }
    });
  }

  function getStatusBadge(status: string) {
    if (status === 'active') return <span style={{ background: 'rgba(52,199,89,0.15)', color: '#248A3D', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>Activa</span>;
    if (status === 'rented') return <span style={{ background: 'rgba(0,113,227,0.15)', color: '#005BB5', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>Alquilada</span>;
    return <span style={{ background: 'rgba(142,142,147,0.15)', color: '#8E8E93', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>Inactiva</span>;
  }

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r-xl)', overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }}>
              <th style={{ padding: '16px 20px', fontSize: 13, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Propiedad</th>
              <th style={{ padding: '16px 20px', fontSize: 13, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Propietario</th>
              <th style={{ padding: '16px 20px', fontSize: 13, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Precio</th>
              <th style={{ padding: '16px 20px', fontSize: 13, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estado</th>
              <th style={{ padding: '16px 20px', fontSize: 13, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {listings.map(listing => (
              <tr key={listing.id} style={{ borderBottom: '1px solid var(--line)' }}>
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {listing.image_url ? (
                      <div style={{ width: 48, height: 48, borderRadius: 8, background: `url(${listing.image_url}) center/cover` }} />
                    ) : (
                      <div style={{ width: 48, height: 48, borderRadius: 8, background: 'var(--surface-2)' }} />
                    )}
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{listing.title}</div>
                      <div style={{ fontSize: 13, color: 'var(--muted-2)' }}>{listing.zone}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ color: 'var(--ink)', fontSize: 14 }}>{listing.owner?.full_name || 'Desconocido'}</div>
                  <div style={{ color: 'var(--muted)', fontSize: 13 }}>{listing.owner?.email}</div>
                </td>
                <td style={{ padding: '16px 20px', fontWeight: 500 }}>
                  S/ {listing.price}
                </td>
                <td style={{ padding: '16px 20px' }}>
                  <select 
                    value={listing.status}
                    onChange={(e) => handleStatusChange(listing.id, e.target.value as 'active' | 'inactive' | 'rented')}
                    disabled={isPending}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 'var(--r-md)',
                      border: '1px solid var(--line-strong)',
                      background: 'var(--surface)',
                      fontSize: 14,
                      color: 'var(--ink)',
                      outline: 'none',
                      cursor: 'pointer',
                      marginRight: 8
                    }}
                  >
                    <option value="active">Activa</option>
                    <option value="rented">Alquilada</option>
                    <option value="inactive">Inactiva</option>
                  </select>
                  {getStatusBadge(listing.status)}
                </td>
                <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <Link 
                      href={`/habitacion/${listing.id}`}
                      target="_blank"
                      style={{
                        background: 'var(--surface-2)',
                        color: 'var(--ink)',
                        padding: 8,
                        borderRadius: 8,
                        display: 'grid',
                        placeItems: 'center',
                        textDecoration: 'none'
                      }}
                      title="Ver publicación"
                    >
                      <ExternalLink size={18} />
                    </Link>
                    <button
                      onClick={() => handleDelete(listing.id)}
                      disabled={isPending}
                      title="Eliminar publicación"
                      style={{
                        background: 'rgba(255,59,48,0.1)',
                        color: 'var(--danger)',
                        border: 'none',
                        padding: 8,
                        borderRadius: 8,
                        cursor: 'pointer',
                        display: 'grid',
                        placeItems: 'center',
                        transition: 'background 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,59,48,0.15)'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,59,48,0.1)'}
                    >
                      {isPending ? <Loader2 size={18} className="rmu-spin" /> : <Trash2 size={18} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {listings.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--muted)' }}>
                  No hay publicaciones.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
