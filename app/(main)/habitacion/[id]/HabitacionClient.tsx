'use client';

import { useMemo, useRef, useState, useEffect, type CSSProperties, type ReactNode } from 'react';
import Link from 'next/link';
import type { Listing, ListingFeatures } from '@/lib/types/database';
import { useFavorites } from '@/lib/favorites';
import { createClient } from '@/lib/supabase/client';
import ImageCarousel from '@/components/ui/ImageCarousel';
import { getListingGalleryImages } from '@/lib/listing-images';
import {
  ChevronRight,
  Edit3,
  Heart,
  MessageCircle,
  Share2,
  ShieldCheck,
  Star,
  Wifi,
  Bed,
  Bath,
  Lamp,
  Lock,
  Check,
  X,
} from 'lucide-react';



/* ───────────────────────────── Mocks razonables ─────────────────────────────
   Estos campos no existen aún en tu tabla. Cuando los añadas,
   reemplaza estos valores con `listing.<campo>` correspondiente.
*/
const MOCK = {
  hostName: 'María C.',
  hostInitials: 'MC',
  hostResponseTime: '~2 h',
  hostPhone: '51999000111',

  areaM2: 14,
  beds: 1,
  bathLabel: 'Baño privado',
  roomTypeLabel: 'Habitación privada',

  address: 'Jr. Los Incas',
  distanceUNAP: 'A 8 min de UNAP',

  rating: 4.9,
  reviewsCount: 42,

  servicesIncluded: [
    'Agua, luz y gas incluidos',
    'Limpieza áreas comunes',
    'Cocina equipada',
    'Lavadora compartida',
    'Sala de estudio',
    'Ropa de cama',
  ] as const,
  servicesExcluded: ['Estacionamiento', 'Mascotas permitidas'] as const,
};

/* ───────────────────────────── Componente ───────────────────────────── */

export default function HabitacionClient({ listing }: { listing: Listing }) {
  const [waOpen, setWaOpen] = useState(false);
  const [waMsg, setWaMsg] = useState(
    `Hola ${MOCK.hostName.split(' ')[0]}, soy estudiante de la UNAP y estoy interesado/a en "${listing.title}" en ${listing.zone} por S/ ${listing.price}/mes. ¿Sigue disponible?`,
  );
  const [moreOpen, setMoreOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [months, setMonths] = useState<number>(6);
  const toastTimerRef = useRef<number | null>(null);
  const { isFavorite, toggleFavorite } = useFavorites();
  const supabase = useMemo(() => createClient(), []);
  const [sessionUser, setSessionUser] = useState<{ id: string } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setSessionUser(data.user ? { id: data.user.id } : null);
    });
  }, [supabase]);

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => setToast(null), 1800);
  }

  function toggleFav() {
    const nextFavorite = !isFavorite(listing.id);
    toggleFavorite(listing.id);
    showToast(nextFavorite ? 'Añadido a favoritos' : 'Quitado de favoritos');
  }

  async function onShare() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast('Enlace copiado');
    } catch {
      showToast('No se pudo copiar');
    }
  }

  function sendWa() {
    const url = `https://wa.me/${MOCK.hostPhone}?text=${encodeURIComponent(waMsg)}`;
    window.open(url, '_blank', 'noopener');
    setWaOpen(false);
  }

  const total = useMemo(() => {
    const monthly = listing.price * months;
    const guarantee = listing.price;
    return { monthly, guarantee, total: monthly + guarantee };
  }, [listing.price, months]);

  const formattedPrice = (n: number) => `S/ ${n.toLocaleString('es-PE')}`;
  const hostInitials = MOCK.hostInitials;

  const feats = (listing.features ?? {}) as ListingFeatures;
  const galleryImages = getListingGalleryImages({ imageUrl: listing.image_url, features: listing.features });

  const favorite = isFavorite(listing.id);

  const fullDesc = listing.description ?? 'Habitación cerca de la UNAP en zona tranquila.';
  const splitAt = 240;
  const hasMore = fullDesc.length > splitAt;
  const visibleDesc = !hasMore || moreOpen ? fullDesc : fullDesc.slice(0, splitAt) + '…';

  return (
    <div className="rmu-detail" style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--ink)' }}>
      <main style={{ width: '100%', maxWidth: 1240, margin: '0 auto', padding: '0 32px', paddingBottom: 80 }}>
        {/* Breadcrumbs */}
        <nav
          aria-label="Ruta de navegación"
          style={{
            padding: '20px 0 8px',
            fontSize: 13,
            color: 'var(--muted-2)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexWrap: 'wrap',
          }}
        >
          <Link href="/" className="rmu-crumb">
            Habitaciones
          </Link>
          <ChevronRight size={10} style={{ color: 'var(--muted)' }} />
          <Link href={`/?zone=${encodeURIComponent(listing.zone)}`} className="rmu-crumb">
            {listing.zone}
          </Link>
          <ChevronRight size={10} style={{ color: 'var(--muted)' }} />
          <span style={{ color: 'var(--ink)' }}>{listing.title}</span>
        </nav>

        {/* Title row */}
        <div
          className="rmu-title-row"
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 24,
            margin: '8px 0 20px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 'clamp(28px, 3.4vw, 36px)',
                letterSpacing: '-0.022em',
                fontWeight: 600,
                lineHeight: 1.15,
              }}
            >
              {listing.title}
            </h1>
            <div
              style={{
                marginTop: 6,
                fontSize: 14,
                color: 'var(--ink-2)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Star size={13} fill="currentColor" />
                {MOCK.rating} · {MOCK.reviewsCount} reseñas
              </span>
              <Dot />
              <span>{listing.zone}, Puno</span>
              <Dot />
              <span>{MOCK.distanceUNAP}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <ActionChip onClick={onShare} icon={<Share2 size={14} />}>
              Compartir
            </ActionChip>
            {sessionUser?.id === listing.owner_id && (
              <Link
                href={`/editar/${listing.id}`}
                className="rmu-action-chip"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 14px',
                  borderRadius: 'var(--r-pill)',
                  fontSize: 13,
                  color: 'var(--ink-2)',
                }}
              >
                <Edit3 size={14} />
                Editar
              </Link>
            )}
            <ActionChip
              onClick={toggleFav}
              icon={
                <Heart
                  size={14}
                  fill={favorite ? 'var(--danger)' : 'none'}
                  color={favorite ? 'var(--danger)' : 'currentColor'}
                />
              }
            >
              {favorite ? 'Guardado' : 'Guardar'}
            </ActionChip>
          </div>
        </div>

        {/* Gallery */}
        <section aria-label="Galería" style={{ marginTop: 8 }}>
          {galleryImages.length > 0 ? (
            <ImageCarousel images={galleryImages} variant="detail" />
          ) : (
            <div
              style={{
                height: 'clamp(280px, 42vw, 560px)',
                borderRadius: 'var(--r-xl)',
                overflow: 'hidden',
                border: '1px solid var(--line)',
                background:
                  'radial-gradient(circle at 30% 40%, #ced9e6 0%, transparent 40%), radial-gradient(circle at 70% 70%, #d4e0d6 0%, transparent 45%), linear-gradient(135deg, #eef1f5, #e4e9ef)',
                display: 'grid',
                placeItems: 'center',
                color: 'var(--muted-2)',
                fontSize: 14,
                fontWeight: 500,
                letterSpacing: '-0.01em',
              }}
            >
              Sin imágenes
            </div>
          )}
        </section>

        {/* Body grid */}
        <div
          className="rmu-body"
          style={{
            marginTop: 48,
            display: 'grid',
            gridTemplateColumns: '1fr 380px',
            gap: 64,
            alignItems: 'start',
          }}
        >
          {/* Left column */}
          <div>
            {/* Host */}
            <Section first>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #e3dccf, #b9a78a)',
                    color: '#fff',
                    fontSize: 18,
                    fontWeight: 600,
                    display: 'grid',
                    placeItems: 'center',
                    border: '1px solid var(--line)',
                  }}
                >
                  {hostInitials}
                </div>
                <div>
                  <strong style={{ display: 'block', fontWeight: 600, letterSpacing: '-0.01em' }}>
                    Habitación ofrecida por {MOCK.hostName}
                  </strong>
                  <span style={{ fontSize: 13, color: 'var(--muted-2)' }}>
                    {listing.is_verified ? 'Anfitrión verificado · ' : ''}Responde en {MOCK.hostResponseTime}
                  </span>
                </div>
              </div>
              <div
                style={{
                  marginTop: 14,
                  fontSize: 14,
                  color: 'var(--ink-2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  flexWrap: 'wrap',
                }}
              >
                <span>{MOCK.roomTypeLabel}</span>
                <Dot />
                <span>{MOCK.areaM2} m²</span>
                <Dot />
                <span>{MOCK.beds} cama</span>
                <Dot />
                <span>{MOCK.bathLabel}</span>
              </div>
            </Section>

            {/* Descripción */}
            <Section>
              <h2 style={sectionH2}>Descripción</h2>
              <div style={{ color: 'var(--ink-2)', fontSize: 15, maxWidth: 640 }}>
                <p style={{ margin: 0 }}>{visibleDesc}</p>
              </div>
              {hasMore && (
                <button
                  type="button"
                  onClick={() => setMoreOpen((v) => !v)}
                  style={{
                    marginTop: 10,
                    fontSize: 14,
                    fontWeight: 500,
                    color: 'var(--ink)',
                    textDecoration: 'underline',
                    textUnderlineOffset: 4,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  {moreOpen ? 'Leer menos' : 'Leer más'}
                </button>
              )}
            </Section>

            {/* Features */}
            <Section>
              <h2 style={sectionH2}>Lo que ofrece este cuarto</h2>
              <div
                className="rmu-features"
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 24px', maxWidth: 640 }}
              >
                {feats.has_wifi ? <Feat icon={<Wifi size={20} />} title="Wifi alta velocidad" sub="Incluido en el pago" /> : null}
                {feats.has_private_bathroom ? (
                  <Feat icon={<Bath size={20} />} title="Baño privado" sub="Solo para ti" />
                ) : (
                  <Feat icon={<Bath size={20} />} title="Baño compartido" sub="Compartido con otros cuartos" />
                )}
                {feats.has_security_cameras ? (
                  <Feat icon={<Lock size={20} />} title="Cámaras de seguridad" sub="Monitoreo 24/7" />
                ) : null}
                {feats.is_shared_bed ? (
                  <Feat icon={<Bed size={20} />} title="Cama compartida" sub="Para dos personas" />
                ) : (
                  <Feat icon={<Bed size={20} />} title="Cama individual" sub="Solo para ti" />
                )}
                {feats.has_kitchen ? <Feat icon={<Lamp size={20} />} title="Cocina equipada" sub="Uso libre de cocina" /> : null}
                {feats.has_washing_machine ? (
                  <Feat icon={<ShieldCheck size={20} />} title="Lavadora" sub="Uso compartido" />
                ) : null}
              </div>
            </Section>

            {/* Servicios */}
            <Section>
              <h2 style={sectionH2}>Servicios incluidos</h2>
              <div
                className="rmu-services"
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 28px', maxWidth: 640 }}
              >
                {MOCK.servicesIncluded.map((s) => (
                  <Serv key={s} text={s} included />
                ))}
                {MOCK.servicesExcluded.map((s) => (
                  <Serv key={s} text={s} included={false} />
                ))}
              </div>
            </Section>

            {/* Ubicación */}
            <Section>
              <h2 style={sectionH2}>Ubicación</h2>
              <p style={{ color: 'var(--muted-2)', maxWidth: 640, margin: '0 0 14px' }}>
                {MOCK.address}, {listing.zone}, Puno · {MOCK.distanceUNAP.toLowerCase()}.
              </p>
              <div
                role="img"
                aria-label="Mapa aproximado"
                style={{
                  marginTop: 8,
                  height: 280,
                  borderRadius: 'var(--r-xl)',
                  overflow: 'hidden',
                  position: 'relative',
                  background:
                    'radial-gradient(circle at 30% 40%, #ced9e6 0%, transparent 40%), radial-gradient(circle at 70% 70%, #d4e0d6 0%, transparent 45%), linear-gradient(135deg, #eef1f5, #e4e9ef)',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage:
                      'linear-gradient(to right, rgba(0,0,0,.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,.04) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -100%) rotate(-45deg)',
                    width: 28,
                    height: 28,
                    background: 'var(--accent)',
                    borderRadius: '50% 50% 50% 0',
                    boxShadow: '0 6px 16px rgba(0,113,227,.35)',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      inset: 7,
                      background: '#fff',
                      borderRadius: '50%',
                      display: 'block',
                    }}
                  />
                </div>
                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, 22px)',
                    background: '#fff',
                    padding: '6px 12px',
                    borderRadius: 'var(--r-pill)',
                    fontSize: 12,
                    fontWeight: 500,
                    boxShadow: 'var(--shadow-sm)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {listing.zone} · Puno
                </div>
              </div>
            </Section>
          </div>

          {/* Sidebar */}
          <aside className="rmu-side" style={{ position: 'sticky', top: 88 }}>
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--r-xl)',
                boxShadow: 'var(--shadow-md)',
                padding: 24,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
                <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em' }}>
                  {formattedPrice(listing.price)}
                  <small style={{ fontSize: 15, fontWeight: 400, color: 'var(--muted-2)', letterSpacing: '-0.01em', marginLeft: 2 }}>
                    / mes
                  </small>
                </div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 13,
                    color: 'var(--ink-2)',
                  }}
                >
                  <Star size={12} fill="currentColor" />
                  {MOCK.rating}
                </div>
              </div>

              <div
                style={{
                  border: '1px solid var(--line-strong)',
                  borderRadius: 14,
                  overflow: 'hidden',
                  marginBottom: 14,
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                  <div style={{ padding: '10px 14px', borderRight: '1px solid var(--line-strong)' }}>
                    <span style={dateLabel}>Ingreso</span>
                    <input type="text" defaultValue="1 May 2026" style={dateField} />
                  </div>
                  <div style={{ padding: '10px 14px' }}>
                    <span style={dateLabel}>Meses</span>
                    <select value={months} onChange={(e) => setMonths(Number(e.target.value))} style={dateField}>
                      <option value={3}>3 meses</option>
                      <option value={6}>6 meses</option>
                      <option value={12}>12 meses</option>
                    </select>
                  </div>
                </div>
                <div style={{ padding: '10px 14px', borderTop: '1px solid var(--line-strong)' }}>
                  <span style={dateLabel}>Ocupantes</span>
                  <select defaultValue="1" style={dateField}>
                    <option value="1">1 estudiante</option>
                    <option value="2">2 estudiantes</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gap: 8, marginTop: 14 }}>
                <button
                  type="button"
                  onClick={() => setWaOpen(true)}
                  className="rmu-btn-wa"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    height: 52,
                    padding: '0 26px',
                    borderRadius: 'var(--r-pill)',
                    fontSize: 15,
                    fontWeight: 500,
                    background: '#25D366',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    width: '100%',
                  }}
                >
                  <MessageCircle size={18} fill="#fff" stroke="#25D366" />
                  Contactar por WhatsApp
                </button>
                <button
                  type="button"
                  onClick={toggleFav}
                  className="rmu-btn-outline"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    height: 52,
                    padding: '0 26px',
                    borderRadius: 'var(--r-pill)',
                    fontSize: 15,
                    fontWeight: 500,
                    border: '1px solid var(--line-strong)',
                    background: '#fff',
                    color: 'var(--ink-2)',
                    cursor: 'pointer',
                    width: '100%',
                  }}
                >
                  <Heart
                    size={16}
                    fill={favorite ? 'var(--danger)' : 'none'}
                    color={favorite ? 'var(--danger)' : 'currentColor'}
                  />
                  {favorite ? 'Guardado en favoritos' : 'Guardar en favoritos'}
                </button>
              </div>

              <div
                style={{
                  marginTop: 18,
                  paddingTop: 18,
                  borderTop: '1px solid var(--line)',
                  display: 'grid',
                  gap: 8,
                  fontSize: 14,
                  color: 'var(--ink-2)',
                }}
              >
                <PriceRow label={`${formattedPrice(listing.price)} × ${months} meses`} value={formattedPrice(total.monthly)} />
                <PriceRow label="Servicios incluidos" value="S/ 0" />
                <PriceRow label="Garantía (reembolsable)" value={formattedPrice(total.guarantee)} />
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: 6,
                    paddingTop: 10,
                    borderTop: '1px solid var(--line)',
                    color: 'var(--ink)',
                    fontWeight: 600,
                    fontSize: 15,
                  }}
                >
                  <span>Total estimado</span>
                  <span>{formattedPrice(total.total)}</span>
                </div>
              </div>

              <div
                style={{
                  marginTop: 14,
                  padding: '10px 12px',
                  background: 'var(--surface-2)',
                  borderRadius: 12,
                  fontSize: 12,
                  color: 'var(--muted-2)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                }}
              >
                <ShieldCheck size={14} style={{ color: 'var(--ink)', flex: '0 0 auto', marginTop: 1 }} />
                <span>
                  {listing.is_verified ? 'Anfitrión verificado.' : 'Publicación pendiente de verificación.'} Solo
                  reservas confirmadas con contrato. Sin comisión para el estudiante.
                </span>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Mobile bottom bar */}
      <div className="rmu-mbar">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
          <div>
            <strong style={{ fontSize: 17, letterSpacing: '-0.01em' }}>
              {formattedPrice(listing.price)}{' '}
              <span style={{ color: 'var(--muted-2)', fontWeight: 400, fontSize: 13 }}>/ mes</span>
            </strong>
            <small style={{ color: 'var(--muted-2)', fontSize: 12, display: 'block' }}>
              {listing.zone} · Puno
            </small>
          </div>
          <button
            type="button"
            onClick={() => setWaOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              height: 48,
              padding: '0 22px',
              borderRadius: 'var(--r-pill)',
              fontSize: 15,
              fontWeight: 500,
              background: '#25D366',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <MessageCircle size={16} fill="#fff" stroke="#25D366" />
            Contactar
          </button>
        </div>
      </div>

      {/* Toast */}
      <div
        style={{
          position: 'fixed',
          left: '50%',
          bottom: 28,
          transform: toast ? 'translate(-50%, 0)' : 'translate(-50%, 20px)',
          background: 'var(--ink)',
          color: '#fff',
          padding: '10px 18px',
          borderRadius: 'var(--r-pill)',
          fontSize: 13,
          opacity: toast ? 1 : 0,
          pointerEvents: 'none',
          transition: 'opacity .25s, transform .25s',
          zIndex: 100,
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {toast ?? ''}
      </div>

      {/* WhatsApp modal */}
      {waOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setWaOpen(false);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 120,
            background: 'rgba(0,0,0,.4)',
            backdropFilter: 'blur(4px)',
            display: 'grid',
            placeItems: 'center',
            padding: 20,
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 24,
              maxWidth: 420,
              width: '100%',
              padding: '28px 24px 20px',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <h3 style={{ margin: '0 0 6px', fontSize: 19, fontWeight: 600, letterSpacing: '-0.015em' }}>
              Contactar a {MOCK.hostName.split(' ')[0]} por WhatsApp
            </h3>
            <p style={{ margin: '0 0 18px', fontSize: 14, color: 'var(--muted-2)' }}>
              Revisa tu mensaje antes de abrir WhatsApp. Responde en aprox. {MOCK.hostResponseTime}.
            </p>
            <textarea
              value={waMsg}
              onChange={(e) => setWaMsg(e.target.value)}
              style={{
                width: '100%',
                minHeight: 96,
                resize: 'vertical',
                padding: '12px 14px',
                border: '1px solid var(--line-strong)',
                borderRadius: 12,
                fontSize: 14,
                lineHeight: 1.5,
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14 }}>
              <button
                type="button"
                onClick={() => setWaOpen(false)}
                className="rmu-btn-ghost"
                style={modalBtnGhost}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={sendWa}
                className="rmu-btn-wa"
                style={{ ...modalBtnGhost, background: '#25D366', color: '#fff', border: 'none' }}
              >
                Abrir WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Estilos locales */}
      <style jsx global>{`
        .rmu-detail .rmu-btn-wa:hover { background: #1fb957; }
        .rmu-detail .rmu-btn-outline:hover { background: var(--surface-2); color: var(--ink); }
        .rmu-detail .rmu-action-chip:hover { background: var(--surface-2); }
        .rmu-detail .rmu-crumb:hover { color: var(--ink); }

        .rmu-mbar {
          display: none;
          position: fixed; left: 0; right: 0; bottom: 0; z-index: 40;
          background: rgba(255, 255, 255, 0.96);
          backdrop-filter: blur(20px);
          border-top: 1px solid var(--line);
          padding: 12px 20px calc(12px + env(safe-area-inset-bottom));
        }

        @media (max-width: 960px) {
          .rmu-detail .rmu-body { grid-template-columns: 1fr !important; gap: 32px !important; }
          .rmu-detail .rmu-side { position: static !important; }
          .rmu-mbar { display: block; }
          .rmu-detail main { padding-bottom: 96px !important; }
        }

        @media (max-width: 640px) {
          .rmu-detail main { padding: 0 20px !important; }
        }

        @media (max-width: 520px) {
          .rmu-detail .rmu-features, .rmu-detail .rmu-services { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

const sectionH2: CSSProperties = {
  margin: '0 0 14px',
  fontSize: 22,
  letterSpacing: '-0.018em',
  fontWeight: 600,
};

const dateLabel: CSSProperties = {
  display: 'block',
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
};

const dateField: CSSProperties = {
  appearance: 'none',
  WebkitAppearance: 'none',
  background: 'transparent',
  border: 'none',
  outline: 'none',
  padding: 0,
  width: '100%',
  fontSize: 14,
  color: 'var(--ink)',
  fontFamily: 'inherit',
};

const modalBtnGhost: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  height: 38,
  padding: '0 18px',
  borderRadius: 'var(--r-pill)',
  fontSize: 14,
  fontWeight: 500,
  background: 'transparent',
  color: 'var(--ink-2)',
  border: 'none',
  cursor: 'pointer',
};

function Section({ children, first }: { children: ReactNode; first?: boolean }) {
  return (
    <section
      style={{
        padding: first ? '0 0 28px' : '28px 0',
        borderTop: first ? 'none' : '1px solid var(--line)',
      }}
    >
      {children}
    </section>
  );
}

function Dot() {
  return (
    <span
      style={{
        width: 3,
        height: 3,
        borderRadius: '50%',
        background: 'var(--muted)',
        display: 'inline-block',
      }}
    />
  );
}

function ActionChip({
  onClick,
  icon,
  children,
}: {
  onClick: () => void;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rmu-action-chip"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 14px',
        borderRadius: 'var(--r-pill)',
        fontSize: 13,
        color: 'var(--ink-2)',
        transition: 'background .15s',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
      }}
    >
      {icon}
      {children}
    </button>
  );
}

function Feat({ icon, title, sub }: { icon: ReactNode; title: string; sub: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '12px 0',
        borderBottom: '1px solid var(--line)',
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          flex: '0 0 auto',
          borderRadius: 12,
          background: 'var(--surface-2)',
          display: 'grid',
          placeItems: 'center',
          color: 'var(--ink)',
        }}
      >
        {icon}
      </div>
      <div>
        <strong style={{ display: 'block', fontSize: 14, fontWeight: 600, letterSpacing: '-0.005em' }}>{title}</strong>
        <span style={{ fontSize: 13, color: 'var(--muted-2)' }}>{sub}</span>
      </div>
    </div>
  );
}

function Serv({ text, included }: { text: string; included: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 0',
        fontSize: 14,
        color: included ? 'var(--ink-2)' : 'var(--muted)',
        textDecoration: included ? 'none' : 'line-through',
        textDecorationThickness: included ? 'auto' : 1,
      }}
    >
      {included ? (
        <Check size={18} strokeWidth={2.2} style={{ color: 'var(--ink)', flex: '0 0 auto' }} />
      ) : (
        <X size={18} strokeWidth={2} style={{ color: 'var(--muted)', flex: '0 0 auto' }} />
      )}
      {text}
    </div>
  );
}

function PriceRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
