'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Listing, ListingFeatures } from '@/lib/types/database';
import UserMenu from '@/components/layout/UserMenu';
import ImageGridEditor, { type ImageSlotData } from '@/components/ImageGridEditor';
import { IMAGE_ENV_LABELS, getDefaultImageLabel, getEditorImageSeeds } from '@/lib/listing-images';

const STORAGE_BUCKET = 'room_images';

const ZONES = [
  'Centro',
  'Barrio Bellavista',
  'Salcedo',
  'Chanu Chanu',
  'Huáscar',
  'José A. Encinas',
  'Alto Puno',
] as const;

const STATUS_OPTIONS = [
  { value: 'active', label: 'Activa' },
  { value: 'inactive', label: 'Inactiva' },
  { value: 'rented', label: 'Arrendada' },
] as const;

type StatusValue = Listing['status'];

type FormState = {
  title: string;
  price: string;
  zone: string;
  desc: string;
  status: StatusValue;
  has_wifi: boolean;
  has_private_bathroom: boolean;
  has_security_cameras: boolean;
  is_shared_bed: boolean;
  has_kitchen: boolean;
  has_washing_machine: boolean;
};

type FieldName = keyof FormState | 'image';

function validateField(name: FieldName, form: FormState) {
  switch (name) {
    case 'title':
      return form.title.trim().length >= 6;
    case 'price': {
      const n = Number(form.price);
      return Number.isFinite(n) && n >= 50 && n <= 5000;
    }
    case 'zone':
      return form.zone !== '';
    case 'desc':
      return form.desc.trim().length >= 30;
    case 'status':
      return true;
    case 'image':
      return true;
    default:
      return true;
  }
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateString));
}

export default function EditRoomClient({ listing }: { listing: Listing }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const features = (listing.features ?? {}) as ListingFeatures;
  const initialForm: FormState = {
    title: listing.title,
    price: String(listing.price),
    zone: listing.zone,
    desc: listing.description ?? '',
    status: listing.status,
    has_wifi: !!features.has_wifi,
    has_private_bathroom: !!features.has_private_bathroom,
    has_security_cameras: !!features.has_security_cameras,
    is_shared_bed: !!features.is_shared_bed,
    has_kitchen: !!features.has_kitchen,
    has_washing_machine: !!features.has_washing_machine,
  };

  const seededImages = getEditorImageSeeds({ imageUrl: listing.image_url, features: listing.features });
  const seededByLabel = new Map(seededImages.map((slot) => [slot.label, slot.url]));
  const initialSlots: ImageSlotData[] = IMAGE_ENV_LABELS.map((label, index) => {
    const url = seededByLabel.get(label) || '';
    return {
      id: String(index + 1),
      label,
      isMain: index === 0,
      file: null,
      previewUrl: url,
      remoteUrl: url,
      status: url ? 'ready' : 'empty',
    };
  });

  const [form, setForm] = useState<FormState>(initialForm);
  const [baseline, setBaseline] = useState<FormState>(initialForm);
  const [imageSlots, setImageSlots] = useState<ImageSlotData[]>(initialSlots);
  const [touched, setTouched] = useState<Record<FieldName, boolean>>({
    title: false,
    price: false,
    zone: false,
    desc: false,
    status: false,
    image: false,
    has_wifi: false,
    has_private_bathroom: false,
    has_security_cameras: false,
    is_shared_bed: false,
    has_kitchen: false,
    has_washing_machine: false,
  });
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  const toastTimerRef = useRef<number | null>(null);

  const validity = {
    title: validateField('title', form),
    price: validateField('price', form),
    zone: validateField('zone', form),
    desc: validateField('desc', form),
    status: validateField('status', form),
    has_wifi: true,
    has_private_bathroom: true,
    has_security_cameras: true,
    is_shared_bed: true,
    has_kitchen: true,
    has_washing_machine: true,
    image: imageSlots[0].status === 'ready' && !!imageSlots[0].previewUrl,
  };

  const formValid = Object.values(validity).every(Boolean);
  const dirty =
    form.title.trim() !== baseline.title.trim() ||
    form.price.trim() !== baseline.price.trim() ||
    form.zone !== baseline.zone ||
    form.desc.trim() !== baseline.desc.trim() ||
    form.status !== baseline.status ||
    form.has_wifi !== baseline.has_wifi ||
    form.has_private_bathroom !== baseline.has_private_bathroom ||
    form.has_security_cameras !== baseline.has_security_cameras ||
    form.is_shared_bed !== baseline.is_shared_bed ||
    form.has_kitchen !== baseline.has_kitchen ||
    form.has_washing_machine !== baseline.has_washing_machine ||
    imageSlots.some((slot, index) => slot.label !== initialSlots[index]?.label) ||
    imageSlots.some(s => s.status !== 'empty' && !s.remoteUrl) ||
    imageSlots[0].remoteUrl !== (listing.image_url || '') ||
    imageSlots[1].remoteUrl !== (features.image_urls?.[0] || '') ||
    imageSlots[2].remoteUrl !== (features.image_urls?.[1] || '') ||
    imageSlots[3].remoteUrl !== (features.image_urls?.[2] || '');

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((state) => ({ ...state, [key]: value }));
  }

  function markTouched(name: FieldName) {
    setTouched((state) => ({ ...state, [name]: true }));
  }

  function showToast(message: string) {
    setToast(message);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 2000);
  }

  useEffect(() => {
    const preventUnload = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', preventUnload);
    return () => window.removeEventListener('beforeunload', preventUnload);
  }, [dirty]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched({
      title: true, price: true, zone: true, desc: true, status: true, image: true,
      has_wifi: true, has_private_bathroom: true, has_security_cameras: true,
      is_shared_bed: true, has_kitchen: true, has_washing_machine: true,
    });
    if (!formValid || saving) return;

    setSubmitError(null);
    setSaving(true);

    try {
      const uploadedUrls: string[] = [];
      for (const slot of imageSlots) {
        if (slot.status === 'ready' && slot.file) {
          const ext = (slot.file.name.split('.').pop() || 'jpg').toLowerCase();
          const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
          const { error: upErr } = await supabase.storage.from(STORAGE_BUCKET).upload(path, slot.file, {
            contentType: slot.file.type,
            upsert: false,
          });
          if (upErr) throw new Error(`Error al subir imagen: ${upErr.message}`);
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

      const finalMainImage = storedImageSlots[0]?.url;
      if (!finalMainImage) throw new Error('La imagen de portada es obligatoria.');
      const extraUrls = storedImageSlots.slice(1).map((slot) => slot.url);

      const { error } = await supabase
        .from('listings')
        .update({
          title: form.title.trim(),
          price: Number(form.price),
          zone: form.zone,
          description: form.desc.trim(),
          status: form.status,
          image_url: finalMainImage,
          features: {
            has_wifi: form.has_wifi,
            has_private_bathroom: form.has_private_bathroom,
            has_security_cameras: form.has_security_cameras,
            is_shared_bed: form.is_shared_bed,
            has_kitchen: form.has_kitchen,
            has_washing_machine: form.has_washing_machine,
            image_slots: storedImageSlots,
            image_urls: extraUrls,
          }
        })
        .eq('id', listing.id);

      if (error) throw new Error(error.message);

      setBaseline({
        title: form.title.trim(),
        price: form.price.trim(),
        zone: form.zone,
        desc: form.desc.trim(),
        status: form.status,
        has_wifi: form.has_wifi,
        has_private_bathroom: form.has_private_bathroom,
        has_security_cameras: form.has_security_cameras,
        is_shared_bed: form.is_shared_bed,
        has_kitchen: form.has_kitchen,
        has_washing_machine: form.has_washing_machine,
      });
      showToast('Cambios guardados');
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudieron guardar los cambios.';
      setSubmitError(message);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (deleteConfirm.trim().toUpperCase() !== 'ELIMINAR' || deleting) return;

    setDeleting(true);
    try {
      const { error } = await supabase.from('listings').delete().eq('id', listing.id);
      if (error) throw new Error(error.message);

      showToast('Publicación eliminada');
      router.push('/');
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo eliminar la publicación.';
      setSubmitError(message);
      setDeleteOpen(false);
    } finally {
      setDeleting(false);
    }
  }

  const statusLabel = STATUS_OPTIONS.find((option) => option.value === listing.status)?.label ?? 'Activa';
  const updatedLabel = formatDate(listing.created_at);
  const titleCount = form.title.length;
  const descCount = form.desc.length;

  const titleError = touched.title && !validity.title && form.title.trim().length > 0;
  const priceError = touched.price && !validity.price && form.price.trim().length > 0;
  const zoneError = touched.zone && !validity.zone;
  const descError = touched.desc && !validity.desc && form.desc.trim().length > 0;
  const statusError = touched.status && !validity.status;

  return (
    <div className="rmu-edit">
      <header className="nav">
        <div className="container nav-inner">
          <Link href={`/habitacion/${listing.id}`} className="back">
            <ArrowLeft size={16} />
            Volver
          </Link>

          <Link href="/" className="logo">
            <span className="logo-mark" />
            RoomUNAP
          </Link>

          <div className="nav-right">
            <Link href="/favoritos" title="Mis favoritos" className="edit-favs icon-btn-mobile">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <span className="hide-on-mobile">Favoritos</span>
            </Link>
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="page">
        <div className="container form-wrap">
          <div className="head">
            <span className="eyebrow">
              <span className={`status-dot ${listing.status}`} />
              {statusLabel} · visible
            </span>
            <h1>Editar habitación</h1>
            <div className="meta">
              Última actualización: {updatedLabel} ·{' '}
              <Link href={`/habitacion/${listing.id}`} className="meta-link">
                Ver publicación
              </Link>
            </div>
          </div>

          <form className="card" onSubmit={onSubmit} noValidate>
            <Field label="Título" right={`${titleCount} / 60`} error={titleError ? 'Escribe un título descriptivo (mín. 6 caracteres).' : null}>
              <InputShell valid={validity.title && titleCount > 0} invalid={titleError} hasMark>
                <input
                  type="text"
                  maxLength={60}
                  value={form.title}
                  onChange={(e) => update('title', e.target.value)}
                  onBlur={() => markTouched('title')}
                  placeholder="Cuarto privado con vista al lago"
                  autoComplete="off"
                />
                <ValidMark show={validity.title && titleCount > 0} />
              </InputShell>
            </Field>

            <div className="row">
              <Field label="Precio mensual" right="En soles" error={priceError ? 'Ingresa un precio entre S/ 50 y S/ 5 000.' : null}>
                <InputShell valid={validity.price && form.price.trim().length > 0} invalid={priceError}>
                  <span className="prefix">S/</span>
                  <input
                    type="number"
                    min={50}
                    max={5000}
                    step={10}
                    value={form.price}
                    onChange={(e) => update('price', e.target.value)}
                    onBlur={() => markTouched('price')}
                    placeholder="450"
                  />
                  <span className="suffix">/ mes</span>
                  <ValidMark show={validity.price && form.price.trim().length > 0} />
                </InputShell>
              </Field>

              <Field label="Zona" right="Puno" error={zoneError ? 'Selecciona una zona.' : null}>
                <InputShell valid={validity.zone} invalid={zoneError}>
                  <div className="select-wrap">
                    <select
                      value={form.zone}
                      onChange={(e) => {
                        update('zone', e.target.value);
                        markTouched('zone');
                      }}
                      onBlur={() => markTouched('zone')}
                    >
                      <option value="" disabled>
                        Selecciona una zona
                      </option>
                      {ZONES.map((zone) => (
                        <option key={zone} value={zone}>
                          {zone}
                        </option>
                      ))}
                    </select>
                  </div>
                  <ValidMark show={validity.zone} />
                </InputShell>
              </Field>
            </div>

            <Field label="Estado de publicación" right="Visible en la plataforma" error={statusError ? 'Selecciona un estado válido.' : null}>
              <InputShell valid={validity.status} invalid={statusError}>
                <div className="select-wrap">
                  <select
                    value={form.status}
                    onChange={(e) => {
                      update('status', e.target.value as StatusValue);
                      markTouched('status');
                    }}
                    onBlur={() => markTouched('status')}
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <ValidMark show={validity.status} />
              </InputShell>
            </Field>

            <Field label="Descripción" right={`${descCount} / 500`} error={descError ? 'La descripción debe tener al menos 30 caracteres.' : null}>
              <InputShell valid={validity.desc && descCount > 0} invalid={descError}>
                <textarea
                  maxLength={500}
                  value={form.desc}
                  onChange={(e) => update('desc', e.target.value)}
                  onBlur={() => markTouched('desc')}
                  placeholder="Habitación amoblada con vista al lago, cerca de la UNAP..."
                />
                <ValidMark show={validity.desc && descCount > 0} />
              </InputShell>
            </Field>

            <Field label="Imágenes de la habitación" right="Portada requerida" error={touched.image && !validity.image ? 'La imagen de portada es obligatoria.' : null}>
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
                Características
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

            {submitError && <div className="submit-error">{submitError}</div>}

            <div className="actions">
              <div className="left">
                <button type="button" className="btn btn-danger-ghost" onClick={() => setDeleteOpen(true)}>
                  <Trash2 size={14} />
                  Eliminar publicación
                </button>
              </div>

              <div className="right">
                <span className={`save-hint ${dirty ? 'show' : ''}`}>
                  <span className="dot" />
                  Cambios sin guardar
                </span>
                <button type="button" className="btn btn-outline" onClick={() => router.push(`/habitacion/${listing.id}`)}>
                  Cancelar
                </button>
                <button type="submit" className={`btn btn-primary ${saving ? 'loading' : ''}`} disabled={!formValid || saving || !dirty}>
                  <span className="spinner" />
                  <span className="label">{saving ? 'Guardando…' : 'Guardar cambios'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>

      <div className={`toast ${toast ? 'show' : ''}`}>
        <Check size={14} />
        <span>{toast ?? ''}</span>
      </div>

      <div className={`modal-wrap ${deleteOpen ? 'open' : ''}`} role="dialog" aria-modal="true">
        <div className="modal">
          <div className="icon">
            <Trash2 size={24} />
          </div>
          <h3>¿Eliminar esta publicación?</h3>
          <p>
            Se quitará de los resultados y no podrá recuperarse. Para confirmar, escribe <strong>ELIMINAR</strong> abajo.
          </p>
          <input
            type="text"
            className="confirm-input"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder="ELIMINAR"
            autoComplete="off"
          />
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>
              Cancelar
            </button>
            <button
              type="button"
              className={`btn btn-danger ${deleting ? 'loading' : ''}`}
              onClick={onDelete}
              disabled={deleteConfirm.trim().toUpperCase() !== 'ELIMINAR' || deleting}
            >
              {deleting ? 'Eliminando…' : 'Eliminar'}
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .rmu-edit {
          min-height: 100vh;
          background: var(--bg);
          color: var(--ink);
          --bg: #fbfbfd;
          --surface: #ffffff;
          --surface-2: #f5f5f7;
          --line: rgba(0, 0, 0, 0.09);
          --line-strong: rgba(0, 0, 0, 0.16);
          --ink: #1d1d1f;
          --ink-2: #424245;
          --muted: #86868b;
          --muted-2: #6e6e73;
          --accent: #0071e3;
          --accent-press: #0077ed;
          --accent-soft: #e8f1fd;
          --success: #30b34d;
          --danger: #ff3b30;
          --danger-soft: rgba(255, 59, 48, 0.08);
          --danger-press: #d93025;
          --r-md: 12px;
          --r-lg: 18px;
          --r-xl: 24px;
          --r-pill: 980px;
          --shadow-md: 0 1px 2px rgba(0, 0, 0, 0.04), 0 8px 24px rgba(0, 0, 0, 0.05);
          --shadow-lg: 0 2px 4px rgba(0, 0, 0, 0.04), 0 24px 64px rgba(0, 0, 0, 0.1);
        }
        .rmu-edit * {
          box-sizing: border-box;
        }
        .rmu-edit a {
          color: inherit;
          text-decoration: none;
        }
        .rmu-edit button {
          font-family: inherit;
          color: inherit;
          cursor: pointer;
          border: none;
          background: none;
        }
        .rmu-edit input,
        .rmu-edit textarea,
        .rmu-edit select {
          font-family: inherit;
          color: inherit;
        }
        .rmu-edit .container {
          width: 100%;
          max-width: 1240px;
          margin: 0 auto;
          padding: 0 32px;
        }
        .rmu-edit .nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          background: rgba(251, 251, 253, 0.20);
          backdrop-filter: saturate(180%) blur(20px);
          -webkit-backdrop-filter: saturate(180%) blur(20px);
          border-bottom: 1px solid var(--line);
        }
        .rmu-edit .nav-inner {
          height: 64px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
          align-items: center;
          gap: 24px;
        }
        .rmu-edit .logo {
          font-size: 19px;
          font-weight: 600;
          letter-spacing: -0.022em;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .rmu-edit .logo-mark {
          width: 26px;
          height: 26px;
          border-radius: 8px;
          background: var(--ink);
          display: grid;
          place-items: center;
          color: #fff;
          font-size: 13px;
          font-weight: 600;
        }
        .rmu-edit .logo-mark::after {
          content: 'R';
        }
        .rmu-edit .back,
        .rmu-edit .edit-favs {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px 8px 10px;
          border-radius: var(--r-pill);
          font-size: 14px;
          color: var(--ink-2);
          transition: background 0.15s, color 0.15s;
        }
        .rmu-edit .back:hover,
        .rmu-edit .edit-favs:hover {
          background: var(--surface-2);
          color: var(--ink);
        }
        .rmu-edit .nav-right {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          justify-self: end;
        }
        .rmu-edit .nav-user {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: linear-gradient(135deg, #e0e7ef, #c7d1dd);
          color: #4a5263;
          font-size: 12px;
          font-weight: 600;
          display: grid;
          place-items: center;
          border: 1px solid var(--line);
        }
        .rmu-edit .page {
          padding: 112px 0 96px;
        }
        .rmu-edit .form-wrap {
          max-width: 640px;
          margin: 0 auto;
        }
        .rmu-edit .head {
          text-align: center;
          margin-bottom: 36px;
        }
        .rmu-edit .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          background: var(--accent-soft);
          color: var(--accent);
          border-radius: var(--r-pill);
          font-size: 12px;
          font-weight: 500;
          margin-bottom: 14px;
        }
        .rmu-edit .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--success);
        }
        .rmu-edit .status-dot.inactive {
          background: #f59e0b;
        }
        .rmu-edit .status-dot.rented {
          background: var(--danger);
        }
        .rmu-edit .head h1 {
          margin: 0 0 8px;
          font-size: clamp(28px, 3.6vw, 36px);
          letter-spacing: -0.025em;
          font-weight: 600;
          line-height: 1.15;
        }
        .rmu-edit .meta {
          color: var(--muted-2);
          font-size: 14px;
        }
        .rmu-edit .meta-link {
          color: var(--ink-2);
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .rmu-edit .card {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: var(--r-xl);
          box-shadow: var(--shadow-md);
          padding: 32px;
        }
        .rmu-edit .field {
          margin-bottom: 22px;
        }
        .rmu-edit .field-head {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 8px;
        }
        .rmu-edit .field label {
          font-size: 14px;
          font-weight: 500;
          color: var(--ink);
        }
        .rmu-edit .field .hint,
        .rmu-edit .field .count {
          font-size: 12px;
          color: var(--muted);
          font-variant-numeric: tabular-nums;
        }
        .rmu-edit .field .count.warn {
          color: var(--danger);
        }
        .rmu-edit .input-shell {
          position: relative;
          display: flex;
          align-items: center;
          background: var(--surface);
          border: 1px solid var(--line-strong);
          border-radius: var(--r-md);
          transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
        }
        .rmu-edit .input-shell:hover {
          border-color: rgba(0, 0, 0, 0.28);
        }
        .rmu-edit .input-shell:focus-within {
          border-color: var(--accent);
          box-shadow: 0 0 0 4px var(--accent-soft);
        }
        .rmu-edit .input-shell.invalid {
          border-color: var(--danger);
          background: var(--danger-soft);
        }
        .rmu-edit .input-shell.invalid:focus-within {
          box-shadow: 0 0 0 4px rgba(224, 53, 43, 0.14);
        }
        .rmu-edit .input-shell.has-mark > input,
        .rmu-edit .input-shell.has-mark > textarea {
          padding-right: 40px;
        }
        .rmu-edit .input-shell.valid .valid-mark {
          opacity: 1;
          transform: translateY(-50%) scale(1);
        }
        .rmu-edit .valid-mark {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%) scale(0.6);
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: var(--success);
          display: grid;
          place-items: center;
          opacity: 0;
          transition: opacity 0.15s, transform 0.15s;
          pointer-events: none;
        }
        .rmu-edit .valid-mark svg {
          width: 12px;
          height: 12px;
          color: #fff;
        }
        .rmu-edit .prefix,
        .rmu-edit .suffix {
          font-size: 15px;
          color: var(--muted);
          padding: 0 4px 0 14px;
          flex: 0 0 auto;
        }
        .rmu-edit .suffix {
          padding: 0 14px 0 4px;
        }
        .rmu-edit .input-shell input,
        .rmu-edit .input-shell select,
        .rmu-edit .input-shell textarea {
          flex: 1 1 auto;
          width: 100%;
          border: none;
          background: transparent;
          outline: none;
          padding: 14px 16px;
          font-size: 16px;
          color: var(--ink);
          min-width: 0;
        }
        .rmu-edit .input-shell textarea {
          resize: vertical;
          min-height: 128px;
          line-height: 1.55;
        }
        .rmu-edit .select-wrap {
          position: relative;
          width: 100%;
        }
        .rmu-edit .select-wrap select {
          appearance: none;
          -webkit-appearance: none;
          padding-right: 44px;
          cursor: pointer;
        }
        .rmu-edit .select-wrap::after {
          content: '';
          position: absolute;
          right: 18px;
          top: 50%;
          width: 10px;
          height: 10px;
          border-right: 1.6px solid var(--ink-2);
          border-bottom: 1.6px solid var(--ink-2);
          transform: translateY(-70%) rotate(45deg);
          pointer-events: none;
        }
        .rmu-edit .row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }
        .rmu-edit .error {
          display: none;
          margin-top: 6px;
          font-size: 12px;
          color: var(--danger);
        }
        .rmu-edit .field.error-on .error {
          display: block;
        }
        .rmu-edit .img-preview {
          margin-top: 10px;
          height: 180px;
          border-radius: var(--r-lg);
          background: var(--surface-2);
          border: 1px solid var(--line);
          display: grid;
          place-items: center;
          overflow: hidden;
          position: relative;
        }
        .rmu-edit .img-preview.has-image {
          background: #000;
        }
        .rmu-edit .img-preview.empty {
          border-style: dashed;
          border-color: var(--line-strong);
          background: var(--surface-2);
        }
        .rmu-edit .img-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .rmu-edit .img-preview .placeholder {
          color: var(--muted);
          font-size: 13px;
          text-align: center;
          padding: 16px;
          display: grid;
          justify-items: center;
          gap: 6px;
        }
        .rmu-edit .img-preview .placeholder svg {
          width: 28px;
          height: 28px;
          color: var(--muted);
        }
        .rmu-edit .img-preview .placeholder .spin {
          animation: spin 0.8s linear infinite;
        }
        .rmu-edit .img-preview .placeholder small {
          color: var(--muted-2);
        }
        .rmu-edit .actions {
          margin-top: 28px;
          padding-top: 24px;
          border-top: 1px solid var(--line);
          display: flex;
          gap: 16px;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
        }
        .rmu-edit .actions .right {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-left: auto;
        }
        .rmu-edit .actions .left {
          display: flex;
          align-items: center;
        }
        .rmu-edit .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          height: 48px;
          padding: 0 24px;
          border-radius: var(--r-pill);
          font-size: 15px;
          font-weight: 500;
          letter-spacing: -0.005em;
          transition:
            background 0.15s,
            color 0.15s,
            transform 0.08s,
            box-shadow 0.15s,
            border-color 0.15s,
            opacity 0.15s;
          white-space: nowrap;
        }
        .rmu-edit .btn:active {
          transform: scale(0.98);
        }
        .rmu-edit .btn-outline {
          border: 1px solid var(--line-strong);
          background: #fff;
          color: var(--ink-2);
        }
        .rmu-edit .btn-outline:hover {
          background: var(--surface-2);
          color: var(--ink);
        }
        .rmu-edit .btn-primary {
          background: var(--accent);
          color: #fff;
          min-width: 150px;
        }
        .rmu-edit .btn-primary:hover {
          background: var(--accent-press);
        }
        .rmu-edit .btn-primary:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
        .rmu-edit .btn-danger-ghost {
          color: var(--danger);
          padding: 0 16px;
          height: 40px;
          font-size: 14px;
          font-weight: 500;
        }
        .rmu-edit .btn-danger-ghost:hover {
          background: var(--danger-soft);
        }
        .rmu-edit .btn-danger {
          background: var(--danger);
          color: #fff;
        }
        .rmu-edit .btn-danger:hover {
          background: var(--danger-press);
        }
        .rmu-edit .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.4);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          display: none;
        }
        .rmu-edit .btn.loading .spinner {
          display: block;
        }
        .rmu-edit .btn.loading .label {
          display: none;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        .rmu-edit .save-hint {
          font-size: 12px;
          color: var(--muted);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .rmu-edit .save-hint.show {
          opacity: 1;
        }
        .rmu-edit .save-hint .dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--accent);
          margin-right: 6px;
          vertical-align: 1px;
        }
        .rmu-edit .submit-error {
          margin-top: 4px;
          padding: 10px 14px;
          border-radius: var(--r-md);
          border: 1px solid rgba(224, 53, 43, 0.25);
          background: rgba(224, 53, 43, 0.06);
          color: var(--danger);
          font-size: 13px;
        }
        .rmu-edit .toast {
          position: fixed;
          left: 50%;
          bottom: 28px;
          transform: translate(-50%, 20px);
          background: var(--ink);
          color: #fff;
          padding: 10px 18px;
          border-radius: var(--r-pill);
          font-size: 13px;
          opacity: 0;
          pointer-events: none;
          transition:
            opacity 0.25s,
            transform 0.25s;
          z-index: 130;
          box-shadow: var(--shadow-lg);
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .rmu-edit .toast.show {
          opacity: 1;
          transform: translate(-50%, 0);
        }
        .rmu-edit .toast svg {
          width: 14px;
          height: 14px;
          color: var(--success);
        }
        .rmu-edit .modal-wrap {
          position: fixed;
          inset: 0;
          z-index: 120;
          background: rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(6px);
          display: grid;
          place-items: center;
          padding: 20px;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s;
        }
        .rmu-edit .modal-wrap.open {
          opacity: 1;
          pointer-events: auto;
        }
        .rmu-edit .modal {
          background: #fff;
          border-radius: 24px;
          max-width: 420px;
          width: 100%;
          padding: 28px 24px 20px;
          box-shadow: var(--shadow-lg);
          transform: scale(0.96);
          transition: transform 0.2s;
        }
        .rmu-edit .modal-wrap.open .modal {
          transform: scale(1);
        }
        .rmu-edit .modal .icon {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: var(--danger-soft);
          display: grid;
          place-items: center;
          margin: 0 auto 14px;
          color: var(--danger);
        }
        .rmu-edit .modal h3 {
          margin: 0 0 6px;
          font-size: 19px;
          font-weight: 600;
          letter-spacing: -0.015em;
          text-align: center;
        }
        .rmu-edit .modal p {
          margin: 0 0 18px;
          font-size: 14px;
          color: var(--muted-2);
          text-align: center;
        }
        .rmu-edit .confirm-input {
          width: 100%;
          padding: 12px 14px;
          border: 1px solid var(--line-strong);
          border-radius: 12px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          margin-bottom: 14px;
        }
        .rmu-edit .confirm-input:focus {
          border-color: var(--danger);
          box-shadow: 0 0 0 4px rgba(224, 53, 43, 0.14);
        }
        .rmu-edit .modal-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }
        @media (max-width: 920px) {
          .rmu-edit .row {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 640px) {
          .rmu-edit .container {
            padding: 0 20px;
          }
          .rmu-edit .page {
            padding: 36px 0 96px;
          }
          .rmu-edit .card {
            padding: 22px;
            border-radius: var(--r-lg);
          }
          .rmu-edit .actions {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
          }
          .rmu-edit .actions .right {
            flex-direction: column-reverse;
            width: 100%;
            gap: 10px;
          }
          .rmu-edit .actions .left {
            width: 100%;
            justify-content: center;
            margin-top: 4px;
          }
          .rmu-edit .actions .btn {
            width: 100%;
          }
          .rmu-edit .actions .btn-danger-ghost {
            width: auto;
          }
          .rmu-edit .save-hint {
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}

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
    <div className={`field ${error ? 'error-on' : ''}`}>
      <div className="field-head">
        <label>{label}</label>
        {right ? <span className="hint">{right}</span> : null}
      </div>
      {children}
      <div className="error">{error}</div>
    </div>
  );
}

function InputShell({
  children,
  valid,
  invalid,
  hasMark,
}: {
  children: ReactNode;
  valid?: boolean;
  invalid?: boolean;
  hasMark?: boolean;
}) {
  const className = ['input-shell', invalid ? 'invalid' : '', valid ? 'valid' : '', hasMark ? 'has-mark' : '']
    .filter(Boolean)
    .join(' ');

  return <div className={className}>{children}</div>;
}

function ValidMark({ show }: { show: boolean }) {
  return (
    <div aria-hidden className="valid-mark" style={{ opacity: show ? 1 : 0 }}>
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
