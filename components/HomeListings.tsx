'use client';

import { useMemo, useState } from 'react';
import ListingCard from '@/components/ui/ListingCard';
import type { Json, Listing } from '@/lib/types/database';

type HomeListing = Pick<
  Listing,
  | 'id'
  | 'owner_id'
  | 'title'
  | 'description'
  | 'price'
  | 'zone'
  | 'image_url'
  | 'status'
  | 'is_verified'
  | 'is_new'
  | 'features'
  | 'created_at'
>;

type HomeListingsProps = {
  listings: HomeListing[];
  errorMessage?: string | null;
};

const ZONES = [
  { value: '', label: 'Todas' },
  { value: 'Centro', label: 'Centro' },
  { value: 'Barrio Bellavista', label: 'Bellavista' },
  { value: 'Salcedo', label: 'Salcedo' },
  { value: 'Chanu Chanu', label: 'Chanu Chanu' },
  { value: 'Huáscar', label: 'Huáscar' },
  { value: 'José A. Encinas', label: 'J.A. Encinas' },
  { value: 'Alto Puno', label: 'Alto Puno' },
];

const PAGE_SIZE = 9;

function isRecord(value: Json | null): value is Record<string, Json | undefined> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export default function HomeListings({ listings, errorMessage }: HomeListingsProps) {
  const [zone, setZone] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [type, setType] = useState('');
  const [bath, setBath] = useState('');
  const [sortBy, setSortBy] = useState('rel');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    const min = minPrice ? Number(minPrice) : null;
    const max = maxPrice ? Number(maxPrice) : null;

    const result = listings.filter((room) => {
      if (zone && room.zone !== zone) return false;
      if (min !== null && room.price < min) return false;
      if (max !== null && room.price > max) return false;

      const features = isRecord(room.features) ? room.features : null;

      if (bath) {
        const isPrivate = features?.has_private_bathroom === true;
        if (bath === 'Privado' && !isPrivate) return false;
        if (bath === 'Compartido' && isPrivate) return false;
      }

      if (type) {
        const isShared = features?.is_shared_bed === true;
        if (type === 'Habitación privada' && isShared) return false;
        if (type === 'Habitación compartida' && !isShared) return false;
        // "Mini-depa" no tiene dato propio: no se filtra.
      }

      return true;
    });

    const sorted = [...result];
    if (sortBy === 'asc') {
      sorted.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'desc') {
      sorted.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'new') {
      sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return sorted;
  }, [listings, zone, minPrice, maxPrice, type, bath, sortBy]);

  const visible = filtered.slice(0, visibleCount);

  return (
    <>
      <form className="filters" id="filterBar" onSubmit={(e) => e.preventDefault()}>
        <div className="filter-field f-zone">
          <span className="filter-label">Zona</span>
          <select
            id="fZone"
            value={zone}
            onChange={(e) => {
              setZone(e.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
          >
            <option value="">Todas las zonas</option>
            {ZONES.slice(1).map((z) => (
              <option key={z.value} value={z.value}>
                {z.value}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-field f-price">
          <span className="filter-label">Precio mensual</span>
          <div className="price-row">
            <span className="sym">S/</span>
            <input
              id="fMin"
              type="number"
              min="0"
              step="50"
              placeholder="mín"
              value={minPrice}
              onChange={(e) => {
                setMinPrice(e.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
            />
            <span className="sym">—</span>
            <input
              id="fMax"
              type="number"
              min="0"
              step="50"
              placeholder="máx"
              value={maxPrice}
              onChange={(e) => {
                setMaxPrice(e.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
            />
          </div>
        </div>

        <div className="filter-field f-type">
          <span className="filter-label">Tipo</span>
          <select
            id="fType"
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
          >
            <option value="">Cualquiera</option>
            <option>Habitación privada</option>
            <option>Habitación compartida</option>
            <option>Mini-depa</option>
          </select>
        </div>

        <div className="filter-field f-beds">
          <span className="filter-label">Baño</span>
          <select
            id="fBath"
            value={bath}
            onChange={(e) => {
              setBath(e.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
          >
            <option value="">Indiferente</option>
            <option>Privado</option>
            <option>Compartido</option>
          </select>
        </div>

        <div className="filter-submit">
          <button type="submit" className="btn btn-primary expanded" aria-label="Filtrar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            Filtrar
          </button>
        </div>
      </form>

      <div className="section-head">
        <div>
          <h2>Habitaciones disponibles</h2>
          <div className="count" id="resultCount">
            {filtered.length} resultados {filtered.length === listings.length ? 'cargados' : 'filtrados'} en Puno
          </div>
        </div>
        <div className="sort">
          <span>Ordenar por</span>
          <select id="sortBy" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="rel">Relevancia</option>
            <option value="asc">Precio: menor a mayor</option>
            <option value="desc">Precio: mayor a menor</option>
            <option value="new">Más recientes</option>
            <option value="rating">Mejor valorados</option>
          </select>
        </div>
      </div>

      <div className="chips" id="zoneChips">
        {ZONES.map((z) => (
          <button
            key={z.value || 'all'}
            type="button"
            className={`chip ${zone === z.value ? 'active' : ''}`}
            data-zone={z.value}
            onClick={() => {
              setZone(z.value);
              setVisibleCount(PAGE_SIZE);
            }}
          >
            {z.label}
          </button>
        ))}
      </div>

      <div className="grid" id="grid">
        {visible.length > 0 ? (
          visible.map((room, index) => <ListingCard key={room.id} listing={room} index={index} />)
        ) : (
          <div className="empty" style={{ gridColumn: '1/-1' }}>
            <h3>No encontramos habitaciones</h3>
            <p>
              {errorMessage
                ? `Error DB: ${errorMessage}`
                : listings.length === 0
                  ? 'Intenta ajustar tus filtros o agregar datos en Supabase.'
                  : 'Ninguna habitación coincide con los filtros seleccionados.'}
            </p>
          </div>
        )}
      </div>

      {visibleCount < filtered.length ? (
        <div className="load-more">
          <button
            type="button"
            className="btn btn-outline"
            id="loadMore"
            onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
          >
            Cargar más habitaciones
          </button>
        </div>
      ) : null}
    </>
  );
}
