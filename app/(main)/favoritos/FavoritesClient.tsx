'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronRight, Heart, MapPin, Sparkles, Undo2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useFavorites, type FavoriteRecord } from '@/lib/favorites';
import type { Listing } from '@/lib/types/database';

type FavoriteRoom = Listing & {
  savedAt: string;
};

type Filter = 'all' | 'cheap' | 'center';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'cheap', label: 'Menos de S/ 400' },
  { key: 'center', label: 'Centro' },
];

function formatSavedAt(savedAt: string) {
  const date = new Date(savedAt);
  if (Number.isNaN(date.getTime())) return 'Guardado recientemente';

  const diff = Date.now() - date.getTime();
  const day = 1000 * 60 * 60 * 24;
  const week = day * 7;

  if (diff < day) return 'Guardado hoy';
  if (diff < 2 * day) return 'Guardado ayer';
  if (diff < week) return `Guardado hace ${Math.max(1, Math.round(diff / day))} días`;

  return `Guardado el ${date.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })}`;
}

export default function FavoritesClient() {
  const supabase = useMemo(() => createClient(), []);
  const { favorites, removeFavorite, addFavorite } = useFavorites();

  const [rooms, setRooms] = useState<FavoriteRoom[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [removed, setRemoved] = useState<FavoriteRecord | null>(null);
  const [undoVisible, setUndoVisible] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!ready) return;

    let active = true;

    async function loadFavorites() {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) {
        if (active) {
          setRooms([]);
          setLoading(false);
          setToast('Inicia sesión para ver tus favoritos.');
        }
        return;
      }

      setLoading(true);

      if (favorites.length === 0) {
        if (active) {
          setRooms([]);
          setLoading(false);
        }
        return;
      }

      const ids = favorites.map((item) => item.id);
      const { data, error } = await supabase
        .from('listings')
        .select('id, owner_id, title, description, price, zone, image_url, status, is_verified, is_new, features, created_at')
        .in('id', ids);

      if (!active) return;

      if (error) {
        setRooms([]);
        setLoading(false);
        setToast(`No se pudieron cargar tus favoritos: ${error.message}`);
        return;
      }

      const byId = new Map(favorites.map((item) => [item.id, item.savedAt]));
      const ordered =
        data?.map((listing) => ({
          ...listing,
          savedAt: byId.get(listing.id) ?? new Date().toISOString(),
        })) ?? [];

      ordered.sort((a, b) => {
        const left = favorites.findIndex((item) => item.id === a.id);
        const right = favorites.findIndex((item) => item.id === b.id);
        return left - right;
      });

      setRooms(ordered);
      setLoading(false);
    }

    loadFavorites();

    return () => {
      active = false;
    };
  }, [favorites, ready, supabase]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filteredRooms = rooms.filter((room) => {
    if (filter === 'all') return true;
    if (filter === 'cheap') return room.price < 400;
    if (filter === 'center') return room.zone === 'Centro';
    return true;
  });

  function showToast(message: string) {
    setToast(message);
  }

  function onRemove(room: FavoriteRoom) {
    setRemovingId(room.id);
    setRemoved({ id: room.id, savedAt: room.savedAt });
    removeFavorite(room.id);
    showToast('Eliminada de favoritos');
    setUndoVisible(true);

    window.setTimeout(() => {
      setRemovingId((current) => (current === room.id ? null : current));
    }, 220);
  }

  function onUndo() {
    if (!removed) return;

    addFavorite(removed.id);
    setRemoved(null);
    setUndoVisible(false);
    showToast('Favorito restaurado');
  }

  return (
    <main className="favorites-shell">
      <div className="page container">
        <div className="page-crumb">
          <Link href="/" className="back-link">
            <ArrowLeft size={16} />
            Volver a habitaciones
          </Link>
        </div>

        <div className="head">
          <div className="head-text">
            <span className="eyebrow">
              <Heart size={12} fill="currentColor" />
              Guardados
            </span>
            <h1>Mis favoritos</h1>
            <p>
              <span className="count-num">{rooms.length}</span> habitaciones guardadas
            </p>
          </div>

          <div className="filters" role="tablist" aria-label="Filtros de favoritos">
            {FILTERS.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`chip ${filter === item.key ? 'active' : ''}`}
                onClick={() => setFilter(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="loading-state card-apple">
            <div className="loading-line w-40" />
            <div className="loading-grid">
              <div className="loading-card" />
              <div className="loading-card" />
              <div className="loading-card" />
            </div>
          </div>
        ) : filteredRooms.length > 0 ? (
          <section className="grid">
            {filteredRooms.map((room) => (
              <article key={room.id} className={`card ${removingId === room.id ? 'removing' : ''}`}>
                <div className="media">
                  {room.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={room.image_url} alt={room.title} loading="lazy" />
                  ) : (
                    <div className="media-fallback">
                      <span>RoomUNAP</span>
                    </div>
                  )}

                  <button
                    type="button"
                    className="heart active"
                    aria-label={`Eliminar ${room.title} de favoritos`}
                    onClick={() => onRemove(room)}
                  >
                    <Heart size={18} fill="var(--danger)" color="var(--danger)" />
                  </button>

                  <span className="zone-badge">
                    <MapPin size={12} />
                    {room.zone}
                  </span>
                </div>

                <div className="body">
                  <h3 className="card-title">{room.title}</h3>
                  <div className="meta">
                    <span className="saved-date">{formatSavedAt(room.savedAt)}</span>
                    {room.is_new ? (
                      <>
                        <span className="dot-sep" />
                        <span className="new-tag">
                          <Sparkles size={12} />
                          Nueva
                        </span>
                      </>
                    ) : null}
                  </div>
                  <div className="price-row">
                    <div className="price">
                      S/ {room.price.toLocaleString('es-PE')}
                      <span className="unit">/mes</span>
                    </div>
                  </div>
                </div>

                <div className="card-footer">
                  <Link href={`/habitacion/${room.id}`} className="btn-detail">
                    Ver detalle
                    <ChevronRight size={14} />
                  </Link>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <section className="empty card-apple">
            <div className="empty-icon">
              <Heart size={28} />
            </div>
            <h3>No tienes favoritos todavía</h3>
            <p>Explora habitaciones y pulsa el corazón para guardarlas. Las encontrarás aquí en cualquier momento.</p>
            <Link href="/" className="btn-primary">
              Explorar habitaciones
            </Link>
          </section>
        )}
      </div>

      <div className={`toast ${toast ? 'show' : ''}`} role="status" aria-live="polite">
        <Heart size={14} fill="currentColor" />
        <span>{toast ?? ''}</span>
        {undoVisible ? (
          <button type="button" className="toast-undo" onClick={onUndo}>
            <Undo2 size={14} />
            Deshacer
          </button>
        ) : null}
      </div>

      <style jsx global>{`
        .favorites-shell {
          min-height: 100vh;
          background: var(--bg);
          color: var(--ink);
        }
        .favorites-shell .page {
          padding: 28px 32px 96px;
        }
        .favorites-shell .page-crumb {
          margin-bottom: 18px;
        }
        .favorites-shell .back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px 8px 10px;
          border-radius: var(--r-pill);
          font-size: 14px;
          color: var(--ink-2);
          transition: background 0.15s, color 0.15s;
        }
        .favorites-shell .back-link:hover {
          background: var(--surface-2);
          color: var(--ink);
        }
        .favorites-shell .head {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 32px;
          flex-wrap: wrap;
        }
        .favorites-shell .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          background: var(--accent-soft);
          color: var(--accent);
          border-radius: var(--r-pill);
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.01em;
          margin-bottom: 14px;
        }
        .favorites-shell .head h1 {
          margin: 0 0 8px;
          font-size: clamp(30px, 4vw, 40px);
          letter-spacing: -0.025em;
          font-weight: 600;
          line-height: 1.1;
        }
        .favorites-shell .head p {
          margin: 0;
          color: var(--muted-2);
          font-size: 16px;
        }
        .favorites-shell .count-num {
          color: var(--ink);
          font-weight: 500;
          font-variant-numeric: tabular-nums;
        }
        .favorites-shell .filters {
          display: inline-flex;
          gap: 6px;
          padding: 4px;
          background: var(--surface-2);
          border-radius: var(--r-pill);
          border: 1px solid var(--line);
        }
        .favorites-shell .chip {
          padding: 8px 16px;
          border-radius: var(--r-pill);
          font-size: 13px;
          font-weight: 500;
          color: var(--muted-2);
          transition: background 0.15s, color 0.15s, box-shadow 0.15s;
          white-space: nowrap;
        }
        .favorites-shell .chip:hover {
          color: var(--ink);
        }
        .favorites-shell .chip.active {
          background: var(--surface);
          color: var(--ink);
          box-shadow: var(--shadow-sm);
        }
        .favorites-shell .grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 24px;
        }
        .favorites-shell .card {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: var(--r-xl);
          box-shadow: var(--shadow-card);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition:
            transform 0.25s cubic-bezier(.2,.8,.2,1),
            box-shadow 0.25s,
            border-color 0.25s,
            opacity 0.3s;
        }
        .favorites-shell .card:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow-card-hover);
          border-color: var(--line-strong);
        }
        .favorites-shell .card.removing {
          opacity: 0;
          transform: scale(0.94);
          pointer-events: none;
        }
        .favorites-shell .media {
          position: relative;
          aspect-ratio: 4 / 3;
          background: var(--surface-2);
          overflow: hidden;
        }
        .favorites-shell .media img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.5s cubic-bezier(.2,.8,.2,1);
        }
        .favorites-shell .card:hover .media img {
          transform: scale(1.04);
        }
        .favorites-shell .media-fallback {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          font-family: var(--mono);
          font-size: 11px;
          color: rgba(255, 255, 255, .82);
          letter-spacing: 0.04em;
          text-transform: lowercase;
          background-image:
            repeating-linear-gradient(135deg, rgba(255,255,255,.07) 0 2px, transparent 2px 14px),
            linear-gradient(135deg, #9fb4c7, #4b6074);
        }
        .favorites-shell .media-fallback::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, transparent 60%, rgba(0,0,0,.18));
        }
        .favorites-shell .media-fallback span {
          position: relative;
          z-index: 1;
        }
        .favorites-shell .heart {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: rgba(255,255,255,.92);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          display: grid;
          place-items: center;
          box-shadow: 0 2px 8px rgba(0,0,0,.12);
          transition: transform .15s, background .15s;
          z-index: 2;
        }
        .favorites-shell .heart:hover {
          background: #fff;
          transform: scale(1.06);
        }
        .favorites-shell .heart:active {
          transform: scale(.92);
        }
        .favorites-shell .heart svg {
          width: 18px;
          height: 18px;
          fill: var(--danger);
          color: var(--danger);
        }
        .favorites-shell .zone-badge {
          position: absolute;
          bottom: 12px;
          left: 12px;
          padding: 5px 10px 5px 8px;
          background: rgba(255,255,255,.92);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border-radius: var(--r-pill);
          font-size: 12px;
          font-weight: 500;
          color: var(--ink);
          display: inline-flex;
          align-items: center;
          gap: 4px;
          box-shadow: 0 2px 8px rgba(0,0,0,.08);
        }
        .favorites-shell .zone-badge svg {
          width: 12px;
          height: 12px;
          color: var(--muted-2);
        }
        .favorites-shell .body {
          padding: 18px 20px 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex: 1;
        }
        .favorites-shell .card-title {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          letter-spacing: -0.012em;
          color: var(--ink);
          line-height: 1.35;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .favorites-shell .meta {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: var(--muted-2);
          flex-wrap: wrap;
        }
        .favorites-shell .meta .dot-sep {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: var(--line-strong);
          display: inline-block;
        }
        .favorites-shell .new-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: var(--accent);
          font-weight: 500;
        }
        .favorites-shell .price-row {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin-top: 2px;
        }
        .favorites-shell .price {
          font-size: 20px;
          font-weight: 600;
          letter-spacing: -0.015em;
          color: var(--ink);
          font-variant-numeric: tabular-nums;
        }
        .favorites-shell .unit {
          font-size: 13px;
          font-weight: 400;
          color: var(--muted);
          margin-left: 2px;
          letter-spacing: 0;
        }
        .favorites-shell .card-footer {
          padding: 0 20px 20px;
          margin-top: auto;
        }
        .favorites-shell .btn-detail {
          width: 100%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          height: 42px;
          padding: 0 18px;
          border-radius: var(--r-pill);
          background: var(--accent);
          color: #fff;
          font-size: 14px;
          font-weight: 500;
          letter-spacing: -0.005em;
          border: 1px solid transparent;
          transition: background .15s, transform .08s, border-color .15s;
        }
        .favorites-shell .btn-detail:hover {
          background: var(--accent-press);
        }
        .favorites-shell .btn-detail:active {
          transform: scale(.98);
        }
        .favorites-shell .empty {
          text-align: center;
          padding: 80px 20px;
          max-width: 440px;
          margin: 0 auto;
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: var(--r-xl);
          box-shadow: var(--shadow-md);
        }
        .favorites-shell .empty-icon {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: var(--surface-2);
          display: grid;
          place-items: center;
          margin: 0 auto 20px;
          border: 1px solid var(--line);
        }
        .favorites-shell .empty-icon svg {
          width: 32px;
          height: 32px;
          color: var(--muted);
        }
        .favorites-shell .empty h3 {
          margin: 0 0 8px;
          font-size: 22px;
          font-weight: 600;
          letter-spacing: -0.015em;
        }
        .favorites-shell .empty p {
          margin: 0 0 24px;
          color: var(--muted-2);
          font-size: 15px;
        }
        .favorites-shell .btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          height: 44px;
          padding: 0 22px;
          border-radius: var(--r-pill);
          background: var(--accent);
          color: #fff;
          font-size: 15px;
          font-weight: 500;
          transition: background .15s, transform .08s;
        }
        .favorites-shell .btn-primary:hover {
          background: var(--accent-press);
        }
        .favorites-shell .btn-primary:active {
          transform: scale(.98);
        }
        .favorites-shell .loading-state {
          padding: 24px;
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: var(--r-xl);
          box-shadow: var(--shadow-md);
        }
        .favorites-shell .loading-line {
          height: 16px;
          border-radius: 999px;
          background: linear-gradient(90deg, #f5f5f7 0%, #d2d2d7 50%, #f5f5f7 100%);
          background-size: 1000px 100%;
          animation: shimmer 1.5s infinite linear;
          margin-bottom: 20px;
        }
        .favorites-shell .loading-line.w-40 {
          width: 40%;
        }
        .favorites-shell .loading-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
        }
        .favorites-shell .loading-card {
          height: 320px;
          border-radius: var(--r-xl);
          background: linear-gradient(90deg, #f5f5f7 0%, #d2d2d7 50%, #f5f5f7 100%);
          background-size: 1000px 100%;
          animation: shimmer 1.5s infinite linear;
        }
        .favorites-shell .toast {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%) translateY(20px);
          background: rgba(29,29,31,.95);
          backdrop-filter: blur(12px);
          color: #fff;
          padding: 12px 16px 12px 14px;
          border-radius: var(--r-pill);
          font-size: 14px;
          display: inline-flex;
          align-items: center;
          gap: 12px;
          box-shadow: var(--shadow-lg);
          opacity: 0;
          pointer-events: none;
          transition: opacity .25s, transform .25s cubic-bezier(.2,.8,.2,1);
          z-index: 100;
        }
        .favorites-shell .toast.show {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
          pointer-events: auto;
        }
        .favorites-shell .toast-undo {
          background: rgba(255,255,255,.15);
          color: #fff;
          padding: 5px 12px;
          border-radius: var(--r-pill);
          font-size: 13px;
          font-weight: 500;
          transition: background .15s;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .favorites-shell .toast-undo:hover {
          background: rgba(255,255,255,.25);
        }
        @media (max-width: 960px) {
          .favorites-shell .grid,
          .favorites-shell .loading-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 640px) {
          .favorites-shell .page {
            padding: 32px 20px 96px;
          }
        }
        @media (max-width: 560px) {
          .favorites-shell .grid,
          .favorites-shell .loading-grid {
            grid-template-columns: 1fr;
          }
          .favorites-shell .head {
            align-items: flex-start;
          }
          .favorites-shell .filters {
            width: 100%;
          }
          .favorites-shell .chip {
            flex: 1 1 0;
            text-align: center;
          }
        }
      `}</style>
    </main>
  );
}
