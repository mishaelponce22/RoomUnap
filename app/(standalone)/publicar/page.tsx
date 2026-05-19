'use client';

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, Heart, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Brand from '@/components/layout/Brand';
import UserMenu from '@/components/layout/UserMenu';
import { IMAGE_ENV_LABELS, getDefaultImageLabel } from '@/lib/listing-images';

/* ─────────────────────────── Tipos y constantes ─────────────────────────── */

type FieldName = 'title' | 'price' | 'zone' | 'desc' | 'image';

type FormState = {
  title: string;
  price: string;
  zone: string;
  desc: string;
  has_wifi: boolean;
  has_private_bathroom: boolean;
  has_security_cameras: boolean;
  is_shared_bed: boolean;
  has_kitchen: boolean;
  has_washing_machine: boolean;
};

const ZONES = [
  'Centro',
  'Barrio Bellavista',
  'Salcedo',
  'Chanu Chanu',
  'Huáscar',
  'José A. Encinas',
  'Alto Puno',
] as const;

const STORAGE_BUCKET = 'listings';

/* ─────────────────────────── Validaciones ─────────────────────────── */

function validate(name: FieldName, state: FormState, hasMainImage: boolean): boolean {
  switch (name) {
    case 'title':
      return state.title.trim().length >= 6;
    case 'price': {
      const n = Number(state.price);
      return Number.isFinite(n) && n >= 50 && n <= 5000;
    }
    case 'zone':
      return state.zone !== '';
    case 'desc':
      return state.desc.trim().length >= 30;
    case 'image':
      return hasMainImage;
  }
}

/* ─────────────────────────── Componente ─────────────────────────── */

import ImageGridEditor, { type ImageSlotData } from '@/components/ImageGridEditor';

const initialSlots: ImageSlotData[] = IMAGE_ENV_LABELS.map((label, index) => ({
  id: String(index + 1),
  label,
  isMain: index === 0,
  file: null,
  previewUrl: '',
  remoteUrl: '',
  status: 'empty',
}));

export default function PublicarPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [form, setForm] = useState<FormState>({
    title: '',
    price: '',
    zone: '',
    desc: '',
    has_wifi: false,
    has_private_bathroom: false,
    has_security_cameras: false,
    is_shared_bed: false,
    has_kitchen: false,
    has_washing_machine: false,
  });

  const [imageSlots, setImageSlots] = useState<ImageSlotData[]>(initialSlots);

  const [touched, setTouched] = useState<Record<FieldName, boolean>>({
    title: false,
    price: false,
    zone: false,
    desc: false,
    image: false,
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const hasMainImage = imageSlots[0].status === 'ready';
  
  const validity: Record<FieldName, boolean> = {
    title: validate('title', form, hasMainImage),
    price: validate('price', form, hasMainImage),
    zone: validate('zone', form, hasMainImage),
    desc: validate('desc', form, hasMainImage),
    image: hasMainImage,
  };
  const formValid = Object.values(validity).every(Boolean);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((s) => ({ ...s, [key]: value }));
  }
  function markTouched(name: FieldName) {
    setTouched((t) => ({ ...t, [name]: true }));
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push('/login');
        return;
      }
      const role = data.user.user_metadata?.role || 'estudiante';
      if (role.toLowerCase() !== 'arrendador') {
        router.push('/');
      }
    });
  }, [router, supabase]);

  function onCancel() {
    const dirty = form.title.trim() || form.price.trim() || form.zone || form.desc.trim() || imageSlots.some(s => s.status !== 'empty');
    if (dirty && !confirm('¿Descartar los cambios y volver al inicio?')) return;
    router.push('/');
  }

  /* ───── Submit ───── */

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTouched({ title: true, price: true, zone: true, desc: true, image: true });
    if (!formValid || submitting) return;

    setSubmitError(null);
    setSubmitting(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw new Error(authError.message);
      if (!authData.user) throw new Error('Necesitas iniciar sesión para publicar.');

      const uploadedUrls: string[] = [];
      for (const slot of imageSlots) {
        if (slot.status === 'ready' && slot.file) {
          const ext = (slot.file.name.split('.').pop() || 'jpg').toLowerCase();
          const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
          const { error: upErr } = await supabase.storage.from(STORAGE_BUCKET).upload(path, slot.file, {
            contentType: slot.file.type,
            upsert: false,
          });
          if (upErr) throw new Error(`No se pudo subir una imagen: ${upErr.message}`);
          const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
          uploadedUrls.push(data?.publicUrl || '');
        } else if (slot.status === 'ready' && slot.remoteUrl) {
          uploadedUrls.push(slot.remoteUrl);
        } else {
          uploadedUrls.push('');
        }
      }

      const storedImageSlots = imageSlots
        .map((slot, index) => ({
          label: slot.label || getDefaultImageLabel(index),
          url: uploadedUrls[index] || '',
        }))
        .filter((slot) => Boolean(slot.url));

      const imageUrl = storedImageSlots[0]?.url;
      if (!imageUrl) throw new Error('La imagen de portada es obligatoria.');
      const extraUrls = storedImageSlots.slice(1).map((slot) => slot.url);

      const { error: insErr } = await supabase.from('listings').insert({
        owner_id: authData.user.id,
        title: form.title.trim(),
        description: form.desc.trim(),
        price: Number(form.price),
        zone: form.zone,
        image_url: imageUrl,
        status: 'active',
        is_verified: false,
        is_new: true,
        features: {
          has_wifi: form.has_wifi,
          has_private_bathroom: form.has_private_bathroom,
          has_security_cameras: form.has_security_cameras,
          is_shared_bed: form.is_shared_bed,
          has_kitchen: form.has_kitchen,
          has_washing_machine: form.has_washing_machine,
          image_slots: storedImageSlots,
          image_urls: extraUrls,
        },
      });
      if (insErr) throw new Error(insErr.message);
      setShowSuccess(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Algo salió mal. Intenta de nuevo.';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  /* ─────────────────────────── Render ─────────────────────────── */

  return (
    <div className="rmu-publicar" style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--ink)' }}>
      {/* Nav */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: 'rgba(251,251,253,.20)',
          backdropFilter: 'saturate(180%) blur(20px)',
          WebkitBackdropFilter: 'saturate(180%) blur(20px)',
          borderBottom: '1px solid var(--line)',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 1240,
            margin: '0 auto',
            padding: '0 32px',
            height: 64,
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)',
            alignItems: 'center',
            gap: 24,
          }}
        >
          <Link
            href="/"
            className="rmu-back"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px 8px 10px',
              borderRadius: 'var(--r-pill)',
              fontSize: 14,
              color: 'var(--ink-2)',
              transition: 'background .15s, color .15s',
            }}
          >
            <ArrowLeft size={16} />
            Volver
          </Link>

          <Brand />

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, justifySelf: 'end' }}>
            <Link
              href="/favoritos"
              className="rmu-favs icon-btn-mobile"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 'var(--r-pill)',
                fontSize: 14,
                color: 'var(--ink-2)',
                transition: 'background .15s',
              }}
            >
              <Heart size={16} />
              <span className="hide-on-mobile">Favoritos</span>
            </Link>
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Page */}
      <main style={{ padding: '112px 0 96px' }}>
        <div
          style={{
            width: '100%',
            maxWidth: 640,
            margin: '0 auto',
            padding: '0 32px',
          }}
        >
          {/* Head */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <span
              style={{
                display: 'inline-block',
                padding: '4px 12px',
                background: 'var(--accent-soft)',
                color: 'var(--accent)',
                borderRadius: 'var(--r-pill)',
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: '0.01em',
                marginBottom: 14,
              }}
            >
              Publicación gratuita
            </span>
            <h1
              style={{
                margin: '0 0 10px',
                fontSize: 'clamp(30px, 4vw, 40px)',
                letterSpacing: '-0.025em',
                fontWeight: 600,
                lineHeight: 1.1,
              }}
            >
              Publica tu habitación
            </h1>
            <p style={{ margin: 0, color: 'var(--muted-2)', fontSize: 16 }}>
              Completa los datos esenciales. Te tomará menos de un minuto.
            </p>

            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 10,
                margin: '28px 0 0',
                fontSize: 12,
                color: 'var(--muted)',
                letterSpacing: '0.02em',
              }}
            >
              <span style={{ width: 22, height: 6, borderRadius: 10, background: 'var(--accent)' }} />
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--line-strong)' }} />
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--line-strong)' }} />
              <span>Información básica</span>
            </div>
          </div>

          {/* Card-form */}
          <form
            onSubmit={onSubmit}
            noValidate
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--r-xl)',
              boxShadow: 'var(--shadow-md)',
              padding: 32,
            }}
          >
            <Field
              label="Título"
              right={
                <span
                  style={{
                    fontSize: 12,
                    fontVariantNumeric: 'tabular-nums',
                    color: form.title.length > 60 * 0.95 ? 'var(--danger)' : 'var(--muted)',
                  }}
                >
                  {form.title.length} / 60
                </span>
              }
              error={touched.title && !validity.title && form.title.length > 0 ? 'Escribe un título descriptivo (mín. 6 caracteres).' : null}
            >
              <InputShell
                valid={validity.title && form.title.length > 0}
                invalid={touched.title && !validity.title && form.title.length > 0}
              >
                <input
                  type="text"
                  maxLength={60}
                  placeholder="Ej. Cuarto privado con vista al lago"
                  autoComplete="off"
                  value={form.title}
                  onChange={(e) => update('title', e.target.value)}
                  onBlur={() => markTouched('title')}
                  style={inputStyle}
                />
                <ValidMark show={validity.title && form.title.length > 0} />
              </InputShell>
            </Field>

            {/* Precio + Zona */}
            <div className="rmu-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              <Field
                label="Precio mensual"
                right={<span style={{ fontSize: 12, color: 'var(--muted)' }}>En soles</span>}
                error={touched.price && !validity.price && form.price !== '' ? 'Ingresa un precio entre S/ 50 y S/ 5 000.' : null}
              >
                <InputShell
                  valid={validity.price && form.price !== ''}
                  invalid={touched.price && !validity.price && form.price !== ''}
                >
                  <span style={{ fontSize: 15, color: 'var(--muted)', padding: '0 4px 0 14px' }}>S/</span>
                  <input
                    type="number"
                    min={50}
                    max={5000}
                    step={10}
                    placeholder="450"
                    value={form.price}
                    onChange={(e) => update('price', e.target.value)}
                    onBlur={() => markTouched('price')}
                    style={{ ...inputStyle, paddingLeft: 2 }}
                  />
                  <ValidMark show={validity.price && form.price !== ''} />
                  <span
                    style={{
                      fontSize: 15,
                      color: 'var(--muted)',
                      padding: '0 14px 0 4px',
                      whiteSpace: 'nowrap',
                      flex: '0 0 auto',
                    }}
                  >
                    / mes
                  </span>
                </InputShell>
              </Field>

              <Field
                label="Zona"
                right={<span style={{ fontSize: 12, color: 'var(--muted)' }}>Puno</span>}
                error={touched.zone && !validity.zone ? 'Selecciona una zona.' : null}
              >
                <InputShell valid={validity.zone} invalid={touched.zone && !validity.zone}>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <select
                      value={form.zone}
                      onChange={(e) => {
                        update('zone', e.target.value);
                        markTouched('zone');
                      }}
                      onBlur={() => markTouched('zone')}
                      style={{
                        ...inputStyle,
                        appearance: 'none',
                        WebkitAppearance: 'none',
                        paddingRight: 44,
                        cursor: 'pointer',
                      }}
                    >
                      <option value="" disabled>
                        Selecciona una zona
                      </option>
                      {ZONES.map((z) => (
                        <option key={z}>{z}</option>
                      ))}
                    </select>
                    <span
                      aria-hidden
                      style={{
                        position: 'absolute',
                        right: 18,
                        top: '50%',
                        width: 10,
                        height: 10,
                        borderRight: '1.6px solid var(--ink-2)',
                        borderBottom: '1.6px solid var(--ink-2)',
                        transform: 'translateY(-70%) rotate(45deg)',
                        pointerEvents: 'none',
                      }}
                    />
                  </div>
                </InputShell>
              </Field>
            </div>

            <Field
              label="Descripción"
              right={
                <span
                  style={{
                    fontSize: 12,
                    fontVariantNumeric: 'tabular-nums',
                    color: form.desc.length > 500 * 0.95 ? 'var(--danger)' : 'var(--muted)',
                  }}
                >
                  {form.desc.length} / 500
                </span>
              }
              error={touched.desc && !validity.desc && form.desc.length > 0 ? 'La descripción debe tener al menos 30 caracteres.' : null}
            >
              <InputShell
                valid={validity.desc && form.desc.length > 0}
                invalid={touched.desc && !validity.desc && form.desc.length > 0}
              >
                <textarea
                  maxLength={500}
                  placeholder="Cuenta lo importante: luz natural, cercanía a la UNAP, servicios incluidos, reglas de convivencia…"
                  value={form.desc}
                  onChange={(e) => update('desc', e.target.value)}
                  onBlur={() => markTouched('desc')}
                  style={{
                    ...inputStyle,
                    resize: 'vertical',
                    minHeight: 128,
                    lineHeight: 1.55,
                  }}
                />
              </InputShell>
            </Field>

            {/* Imagen */}
            <Field
              label="Imágenes de la habitación"
              right={<span style={{ fontSize: 12, color: 'var(--muted)' }}>JPG, PNG o WEBP · máx. 5 MB</span>}
              error={touched.image && !validity.image ? 'La imagen de portada es obligatoria.' : null}
            >
              <div style={{ marginTop: 8 }}>
                <ImageGridEditor
                  slots={imageSlots}
                  onChange={(slots) => {
                    setImageSlots(slots);
                    markTouched('image');
                  }}
                />
              </div>
            </Field>

            {/* Características */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: '-0.005em', color: 'var(--ink)', marginBottom: 12 }}>
                Características (opcional)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <Checkbox label="Wifi fibra alta velocidad" checked={form.has_wifi} onChange={(c) => update('has_wifi', c)} />
                <Checkbox label="Baño privado" checked={form.has_private_bathroom} onChange={(c) => update('has_private_bathroom', c)} />
                <Checkbox label="Cámaras de seguridad" checked={form.has_security_cameras} onChange={(c) => update('has_security_cameras', c)} />
                <Checkbox label="Cama compartida" checked={form.is_shared_bed} onChange={(c) => update('is_shared_bed', c)} />
                <Checkbox label="Cocina equipada" checked={form.has_kitchen} onChange={(c) => update('has_kitchen', c)} />
                <Checkbox label="Lavadora compartida" checked={form.has_washing_machine} onChange={(c) => update('has_washing_machine', c)} />
              </div>
            </div>

            {submitError && (
              <div
                style={{
                  marginTop: 20,
                  padding: '10px 14px',
                  borderRadius: 'var(--r-md)',
                  border: '1px solid rgba(255,59,48,.3)',
                  background: 'rgba(255,59,48,.06)',
                  color: 'var(--danger)',
                  fontSize: 13,
                }}
              >
                {submitError}
              </div>
            )}

            <div className="rmu-actions" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 32 }}>
              <button
                type="button"
                onClick={onCancel}
                className="rmu-btn-outline"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 48,
                  padding: '0 26px',
                  borderRadius: 'var(--r-pill)',
                  fontSize: 15,
                  fontWeight: 500,
                  border: '1px solid var(--line-strong)',
                  background: '#fff',
                  color: 'var(--ink-2)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'background .15s, color .15s',
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!formValid || submitting}
                className="rmu-btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  height: 48,
                  minWidth: 140,
                  padding: '0 26px',
                  borderRadius: 'var(--r-pill)',
                  fontSize: 15,
                  fontWeight: 500,
                  background: 'var(--accent)',
                  color: '#fff',
                  border: 'none',
                  cursor: !formValid || submitting ? 'not-allowed' : 'pointer',
                  opacity: !formValid || submitting ? 0.45 : 1,
                  whiteSpace: 'nowrap',
                  transition: 'background .15s, opacity .15s',
                }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="rmu-spin" />
                    Publicando…
                  </>
                ) : (
                  'Publicar'
                )}
              </button>
            </div>
          </form>

          <p
            style={{
              marginTop: 24,
              textAlign: 'center',
              fontSize: 12,
              color: 'var(--muted)',
              maxWidth: 480,
              marginLeft: 'auto',
              marginRight: 'auto',
              lineHeight: 1.55,
            }}
          >
            Al publicar aceptas nuestros{' '}
            <Link href="#" style={{ color: 'var(--ink-2)', textDecoration: 'underline', textUnderlineOffset: 3 }}>
              Términos
            </Link>{' '}
            y{' '}
            <Link href="#" style={{ color: 'var(--ink-2)', textDecoration: 'underline', textUnderlineOffset: 3 }}>
              Política de comunidad
            </Link>
            . Revisaremos tu publicación en menos de 24 h antes de hacerla visible.
          </p>
        </div>
      </main>

      {/* Modal */}
      {showSuccess && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 120,
            background: 'rgba(0,0,0,.45)',
            backdropFilter: 'blur(6px)',
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
              padding: '32px 28px 24px',
              boxShadow: 'var(--shadow-lg)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: '#34C759',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 14px',
              }}
            >
              <Check size={28} color="#fff" strokeWidth={3} />
            </div>
            <h3 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 600, letterSpacing: '-0.015em' }}>
              Publicación enviada
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: 14, color: 'var(--muted-2)' }}>
              Tu habitación será revisada y publicada en menos de 24 horas. Te avisaremos por correo.
            </p>
            <button
              onClick={() => router.push('/')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: 48,
                padding: '0 26px',
                borderRadius: 'var(--r-pill)',
                fontSize: 15,
                fontWeight: 500,
                background: 'var(--accent)',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Volver al inicio
            </button>
          </div>
        </div>
      )}

      {/* Estilos locales: spin, hovers, focus de input-shell, responsive */}
      <style jsx global>{`
        @keyframes rmu-spin {
          to {
            transform: rotate(360deg);
          }
        }
        .rmu-spin {
          animation: rmu-spin 0.8s linear infinite;
        }
        .rmu-publicar .rmu-back:hover,
        .rmu-publicar .rmu-favs:hover {
          background: var(--surface-2);
        }
        .rmu-publicar .rmu-back:hover {
          color: var(--ink);
        }
        .rmu-publicar .rmu-input-shell {
          position: relative;
          display: flex;
          align-items: center;
          background: var(--surface);
          border: 1px solid var(--line-strong);
          border-radius: var(--r-md);
          transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
        }
        .rmu-publicar .rmu-input-shell:hover {
          border-color: rgba(0, 0, 0, 0.28);
        }
        .rmu-publicar .rmu-input-shell:focus-within {
          border-color: var(--accent);
          box-shadow: 0 0 0 4px rgba(0, 113, 227, 0.12);
        }
        .rmu-publicar .rmu-input-shell.invalid {
          border-color: var(--danger);
          background: rgba(255, 59, 48, 0.06);
        }
        .rmu-publicar .rmu-input-shell.invalid:focus-within {
          box-shadow: 0 0 0 4px rgba(255, 59, 48, 0.14);
        }
        .rmu-publicar .rmu-input-shell.valid > input,
        .rmu-publicar .rmu-input-shell.valid > select,
        .rmu-publicar .rmu-input-shell.valid > textarea {
          padding-right: 40px;
        }
        .rmu-publicar .rmu-btn-outline:hover {
          background: var(--surface-2);
          color: var(--ink);
        }
        .rmu-publicar .rmu-btn-primary:not(:disabled):hover {
          background: var(--accent-press);
        }
        @media (max-width: 640px) {
          .rmu-publicar header > div {
            padding: 0 20px !important;
          }
          .rmu-publicar main > div {
            padding: 0 20px !important;
          }
        }
        @media (max-width: 520px) {
          .rmu-publicar .rmu-row {
            grid-template-columns: 1fr !important;
          }
          .rmu-publicar .rmu-actions {
            flex-direction: column-reverse !important;
          }
          .rmu-publicar .rmu-actions > button {
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}

/* ─────────────────────────── Subcomponentes ─────────────────────────── */

const inputStyle: CSSProperties = {
  flex: '1 1 auto',
  width: '100%',
  border: 'none',
  background: 'transparent',
  outline: 'none',
  padding: '14px 16px',
  fontSize: 16,
  letterSpacing: '-0.005em',
  color: 'var(--ink)',
  minWidth: 0,
  textOverflow: 'ellipsis',
  fontFamily: 'inherit',
};

function Field({
  label,
  right,
  error,
  children,
}: {
  label: string;
  right?: ReactNode;
  error?: string | null;
  children: ReactNode;
}) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <label style={{ fontSize: 14, fontWeight: 500, letterSpacing: '-0.005em', color: 'var(--ink)' }}>
          {label}
        </label>
        {right}
      </div>
      {children}
      {error && (
        <div style={{ marginTop: 6, fontSize: 12, color: 'var(--danger)', letterSpacing: '-0.005em' }}>{error}</div>
      )}
    </div>
  );
}

function InputShell({
  children,
  valid,
  invalid,
}: {
  children: ReactNode;
  valid?: boolean;
  invalid?: boolean;
}) {
  const className = ['rmu-input-shell', invalid ? 'invalid' : '', valid ? 'valid' : ''].filter(Boolean).join(' ');
  return <div className={className}>{children}</div>;
}

function ValidMark({ show }: { show: boolean }) {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        right: 14,
        top: '50%',
        width: 22,
        height: 22,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        opacity: show ? 1 : 0,
        transform: show ? 'translateY(-50%) scale(1)' : 'translateY(-50%) scale(.6)',
        transition: 'opacity .18s ease, transform .18s ease',
        pointerEvents: 'none',
        background: 'var(--success)',
      }}
    >
      <Check size={12} color="#fff" strokeWidth={3} />
    </div>
  );
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14, color: 'var(--ink)' }}>
      <div style={{
        width: 18,
        height: 18,
        borderRadius: 4,
        border: `1.5px solid ${checked ? 'var(--accent)' : 'var(--line-strong)'}`,
        background: checked ? 'var(--accent)' : 'transparent',
        display: 'grid',
        placeItems: 'center',
        transition: 'all .15s'
      }}>
        {checked && <Check size={12} color="#fff" strokeWidth={3} />}
      </div>
      <input 
        type="checkbox" 
        checked={checked} 
        onChange={(e) => onChange(e.target.checked)} 
        style={{ display: 'none' }} 
      />
      {label}
    </label>
  );
}
