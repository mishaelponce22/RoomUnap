'use client';

import Link from 'next/link';
import { ArrowRight, Heart, MapPin, ShieldCheck, Sparkles } from 'lucide-react';
import { useFavorites } from '@/lib/favorites';
import type { Listing } from '@/lib/types/database';
import ImageCarousel from '@/components/ui/ImageCarousel';
import { getListingGalleryImages } from '@/lib/listing-images';

type ListingCardProps = {
  listing: Pick<
    Listing,
    'id' | 'title' | 'description' | 'price' | 'zone' | 'image_url' | 'status' | 'is_verified' | 'is_new' | 'created_at' | 'features'
  >;
  index?: number;
};

const paletteClasses = ['ph-1', 'ph-2', 'ph-3', 'ph-4', 'ph-5', 'ph-6', 'ph-7', 'ph-8', 'ph-9'];

export default function ListingCard({ listing, index = 0 }: ListingCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const paletteClass = paletteClasses[index % paletteClasses.length];
  const isInactive = listing.status !== 'active';
  const galleryImages = getListingGalleryImages({ imageUrl: listing.image_url, features: listing.features });
  const hasImage = galleryImages.length > 0;
  const favorite = isFavorite(listing.id);

  return (
    <article className="card card-apple">
      <Link
        href={`/habitacion/${listing.id}`}
        prefetch={false}
        className="card-media"
        aria-label={`Ver ${listing.title}`}
      >
        {hasImage ? (
          <ImageCarousel images={galleryImages} variant="card" className="card-media__carousel" />
        ) : (
          <div className={`ph ${paletteClass}`}>
            <span>roomunap</span>
          </div>
        )}

        {listing.is_verified ? (
          <div className="card-badge">
            <ShieldCheck size={12} />
            Verificada
          </div>
        ) : null}

        {listing.is_new ? (
          <div
            className="card-badge new"
            style={{ left: listing.is_verified ? 110 : 12 }}
          >
            <Sparkles size={12} />
            Nueva
          </div>
        ) : null}

        {/* Botón favorito DENTRO del card-media para que position:absolute sea relativo a la imagen */}
        <button
          type="button"
          className={`fav ${favorite ? 'active' : ''}`}
          aria-label={favorite ? `Quitar ${listing.title} de favoritos` : `Guardar ${listing.title}`}
          aria-pressed={favorite}
          onClick={(e) => {
            e.preventDefault(); // evita que el Link navegue al hacer clic
            e.stopPropagation();
            toggleFavorite(listing.id);
          }}
        >
          <Heart
            fill={favorite ? 'var(--danger)' : 'none'}
            color={favorite ? 'var(--danger)' : 'currentColor'}
          />
        </button>

      </Link>

      <div className="card-body">
        <div className="card-top">
          <h3 className="card-title" title={listing.title}>
            {listing.title}
          </h3>
          <div className="card-rating" title={listing.zone}>
            <MapPin size={12} />
            {listing.zone}
          </div>
        </div>
        <p className="card-zone">
          {listing.description || 'Habitación disponible cerca de la UNAP.'}
        </p>
        <div className="card-foot">
          <div className="card-price">
            <strong>S/ {listing.price}</strong> <small>/ mes</small>
            {isInactive ? <small> · {listing.status}</small> : null}
          </div>
          <Link
            href={`/habitacion/${listing.id}`}
            prefetch={false}
            className="card-cta"
          >
            Ver detalle
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </article>
  );
}
