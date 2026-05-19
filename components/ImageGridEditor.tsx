'use client';

import { useRef, useState, type CSSProperties, type DragEvent } from 'react';
import { Upload, X, Link2, Loader2, Image as ImageIcon } from 'lucide-react';
import { IMAGE_ENV_LABELS, type ImageLabel } from '@/lib/listing-images';

export type ImageSlotData = {
  id: string;
  label?: ImageLabel;
  previewUrl: string;
  file: File | null;
  remoteUrl: string;
  status: 'empty' | 'loading' | 'ready' | 'error';
  isMain?: boolean;
};

type Props = {
  slots: ImageSlotData[];
  onChange: (slots: ImageSlotData[]) => void;
  error?: string | null;
};

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

function isUrlValidImage(url: string) {
  const u = url.trim();
  if (!u) return false;
  if (/google\.com\/imgres/i.test(u)) return false;
  return (
    /^https?:\/\/\S+\.(jpg|jpeg|png|webp|gif|avif)(\?.*)?$/i.test(u) ||
    /^data:image\/(jpeg|jpg|png|webp|gif|avif);base64,[a-z0-9+/=\s]+$/i.test(u)
  );
}

export default function ImageGridEditor({ slots, onChange, error }: Props) {
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [urlInputIndex, setUrlInputIndex] = useState<number | null>(null);
  const [urlValue, setUrlValue] = useState('');
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const visibleSlots = slots
    .map((slot, index) => ({ slot, index }))
    .filter(({ slot }) => slot.status === 'ready' && slot.previewUrl);
  const readyCount = visibleSlots.length;
  const firstEmptyIndex = slots.findIndex((slot) => slot.status !== 'ready' || !slot.previewUrl);
  const canAddMore = firstEmptyIndex !== -1;
  const usedLabels = new Set(
    visibleSlots
      .map(({ slot }) => slot.label)
      .filter((label): label is ImageLabel => Boolean(label)),
  );

  function updateSlot(index: number, partial: Partial<ImageSlotData>) {
    const next = [...slots];
    next[index] = { ...next[index], ...partial };
    onChange(next);
  }

  function handleFile(file: File | undefined, index: number) {
    if (!file) return;
    const label = ensureSlotLabel(index);
    if (!file.type.startsWith('image/')) {
      alert('Ese archivo no es una imagen. Usa JPG, PNG, WEBP o GIF.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      alert('La imagen supera los 5 MB. Usa una más liviana.');
      return;
    }
    updateSlot(index, { label, status: 'loading' });
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = String(e.target?.result ?? '');
      updateSlot(index, {
        label,
        file,
        previewUrl: dataUrl,
        remoteUrl: '',
        status: 'ready',
      });
    };
    reader.onerror = () => {
      updateSlot(index, { label, status: 'error' });
      alert('No se pudo leer el archivo.');
    };
    reader.readAsDataURL(file);
  }

  function handleUrlSubmit(index: number, overrideUrl?: string) {
    const label = ensureSlotLabel(index);
    const url = (overrideUrl ?? urlValue).trim();
    if (!url) {
      setUrlInputIndex(null);
      return;
    }
    if (!isUrlValidImage(url)) {
      alert('La URL no parece ser una imagen válida.');
      return;
    }
    setUrlInputIndex(null);
    updateSlot(index, { label, status: 'loading' });

    const tester = new Image();
    tester.onload = () => {
      updateSlot(index, {
        label,
        file: null,
        previewUrl: url,
        remoteUrl: url,
        status: 'ready',
      });
    };
    tester.onerror = () => {
      updateSlot(index, { label, status: 'error' });
      alert('No se pudo cargar la imagen desde la URL.');
    };
    tester.src = url;
  }

  function clearSlot(index: number) {
    updateSlot(index, {
      label: undefined,
      file: null,
      previewUrl: '',
      remoteUrl: '',
      status: 'empty',
    });
    if (fileInputRefs.current[index]) {
      fileInputRefs.current[index]!.value = '';
    }
  }

  function openFilePicker(index: number) {
    ensureSlotLabel(index);
    fileInputRefs.current[index]?.click();
  }

  function openUrlEditor(index: number) {
    ensureSlotLabel(index);
    setUrlValue(slots[index]?.remoteUrl || '');
    setUrlInputIndex(index);
  }

  function updateSlotLabel(index: number, label: ImageLabel) {
    updateSlot(index, { label });
  }

  function getDefaultLabel(index: number) {
    return IMAGE_ENV_LABELS[Math.min(index, IMAGE_ENV_LABELS.length - 1)];
  }

  function getAvailableLabels(index: number) {
    const current = slots[index]?.label || getDefaultLabel(index);
    return IMAGE_ENV_LABELS.filter((label) => !usedLabels.has(label) || label === current);
  }

  function getResolvedLabel(index: number) {
    const current = slots[index]?.label || getDefaultLabel(index);
    const options = getAvailableLabels(index);
    return options.includes(current) ? current : options[0] || getDefaultLabel(index);
  }

  function ensureSlotLabel(index: number) {
    const nextLabel = getResolvedLabel(index);
    if (slots[index]?.label !== nextLabel) {
      updateSlot(index, { label: nextLabel });
    }
    return nextLabel;
  }

  function onDrop(e: DragEvent<HTMLDivElement>, index: number) {
    e.preventDefault();
    e.stopPropagation();
    setDragOverIndex(null);
    
    const dt = e.dataTransfer;
    if (!dt) return;
    if (dt.files && dt.files.length > 0) {
      handleFile(dt.files[0], index);
      return;
    }
    const url = dt.getData('text/uri-list') || dt.getData('text/plain');
    if (url) {
      setUrlValue(url);
      setUrlInputIndex(index);
      // Automatically try to load if it looks like an image
      if (isUrlValidImage(url)) {
        handleUrlSubmit(index, url);
      }
    }
  }

  function onCanvasDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragOverIndex(null);

    const targetIndex = firstEmptyIndex === -1 ? 0 : firstEmptyIndex;
    const dt = e.dataTransfer;
    if (!dt) return;

    if (dt.files && dt.files.length > 0) {
      handleFile(dt.files[0], targetIndex);
      return;
    }

    const url = dt.getData('text/uri-list') || dt.getData('text/plain');
    if (url) {
      setUrlValue(url);
      setUrlInputIndex(targetIndex);
      if (isUrlValidImage(url)) {
        handleUrlSubmit(targetIndex, url);
      }
    }
  }

  function tileStyle(position: number, count: number): CSSProperties {
    switch (count) {
      case 1:
        return { gridColumn: '1 / -1', gridRow: '1 / -1' };
      case 2:
        return {
          gridColumn: position === 0 ? '1' : '2',
          gridRow: '1 / -1',
        };
      case 3:
        if (position === 0) {
          return { gridColumn: '1', gridRow: '1 / span 2' };
        }
        return {
          gridColumn: '2',
          gridRow: position === 1 ? '1' : '2',
        };
      default:
        return {
          gridColumn: position % 2 === 0 ? '1' : '2',
          gridRow: position < 2 ? '1' : '2',
        };
    }
  }

  return (
    <div className="image-grid-editor">
      <div className="image-grid-editor__header">
        <div className="image-grid-editor__copy">
          <span className="image-grid-editor__eyebrow">Bento preview</span>
          <h3 className="image-grid-editor__title">Sube, pega o arrastra imágenes</h3>
          <p className="image-grid-editor__subtitle">
          </p>
        </div>
        <div className="image-grid-editor__counter" aria-label={`${readyCount} de ${slots.length} imágenes listas`}>
          <strong>{readyCount}</strong>
          <span>/ {slots.length}</span>
        </div>
      </div>

      <div
        className={`bento-canvas bento-canvas--${Math.max(1, readyCount)}`}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={onCanvasDrop}
      >
        {slots.map((_, index) => (
          <input
            key={`file-input-${slots[index].id}`}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            style={{ display: 'none' }}
            ref={(el) => {
              fileInputRefs.current[index] = el;
            }}
            onChange={(e) => handleFile(e.target.files?.[0], index)}
          />
        ))}

        {readyCount === 0 ? (
          <div className="bento-empty">
            <div className="empty-icon">
              <ImageIcon size={18} />
            </div>
            <div className="empty-copy">
              <strong>Arrastra una imagen aquí</strong>
              <span>O sube un archivo o pega un link para crear el preview al instante</span>
            </div>
            <div className="empty-actions">
              <span className="empty-chip">Drag & drop</span>
              <div className="slot-field">
                <span className="slot-field__label">Ambiente</span>
                <div className="slot-select-wrap">
                  <select
                    className="slot-select"
                    value={getResolvedLabel(firstEmptyIndex)}
                    onChange={(e) => updateSlotLabel(firstEmptyIndex, e.target.value as ImageLabel)}
                  >
                    {getAvailableLabels(firstEmptyIndex).map((label) => (
                      <option key={label} value={label}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="button"
                className="empty-action"
                onClick={(e) => {
                  e.stopPropagation();
                  if (canAddMore) openFilePicker(firstEmptyIndex);
                }}
              >
                <Upload size={14} />
                Subir
              </button>
              <button
                type="button"
                className="empty-action"
                onClick={(e) => {
                  e.stopPropagation();
                  if (canAddMore) openUrlEditor(firstEmptyIndex);
                }}
              >
                <Link2 size={14} />
                URL
              </button>
            </div>
            {urlInputIndex === firstEmptyIndex ? (
              <div className="url-input-wrap" onClick={(e) => e.stopPropagation()}>
                <div className="url-header">
                  <span>Pegar enlace</span>
                  <span>Enter para confirmar</span>
                </div>
                <input
                  type="url"
                  placeholder="https://..."
                  value={urlValue}
                  onChange={(e) => setUrlValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleUrlSubmit(firstEmptyIndex);
                    }
                    if (e.key === 'Escape') setUrlInputIndex(null);
                  }}
                  autoFocus
                />
                <div className="url-actions">
                  <button type="button" className="btn-ok" onClick={() => handleUrlSubmit(firstEmptyIndex)}>
                    Ok
                  </button>
                  <button type="button" className="btn-cancel" onClick={() => setUrlInputIndex(null)}>
                    Cancelar
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <>
            {visibleSlots.map(({ slot, index }, position) => {
              const isDragOver = dragOverIndex === index;
              const showUrlInput = urlInputIndex === index;
              const layoutStyle = tileStyle(position, readyCount);
              const slotLabel = slot.label || getDefaultLabel(index) || `Imagen ${position + 1}`;

              return (
                <div
                  key={slot.id}
                  className={`bento-tile ${isDragOver ? 'drag-over' : ''} ${slot.isMain ? 'main-slot' : ''}`}
                  style={layoutStyle}
                  onClick={() => openFilePicker(index)}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragOverIndex(index);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragOverIndex(index);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.currentTarget === e.target) setDragOverIndex(null);
                  }}
                  onDrop={(e) => onDrop(e, index)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openFilePicker(index);
                    }
                  }}
                  >
                  {slot.status === 'ready' && slot.previewUrl ? (
                    <div className="preview-wrap">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={slot.previewUrl} alt={`Preview ${position + 1}`} className="preview-img" />
                      <div className="slot-badge">{slotLabel}</div>
                      <button
                        type="button"
                        className="clear-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearSlot(index);
                        }}
                        aria-label="Quitar imagen"
                      >
                        <X size={14} />
                      </button>
                      {showUrlInput ? (
                        <div className="url-input-wrap" onClick={(e) => e.stopPropagation()}>
                          <div className="url-header">
                            <span>Pegar enlace</span>
                            <span>Enter para confirmar</span>
                          </div>
                          <input
                            type="url"
                            placeholder="https://..."
                            value={urlValue}
                            onChange={(e) => setUrlValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleUrlSubmit(index);
                              }
                              if (e.key === 'Escape') setUrlInputIndex(null);
                            }}
                            autoFocus
                          />
                          <div className="url-actions">
                            <button type="button" className="btn-ok" onClick={() => handleUrlSubmit(index)}>
                              Ok
                            </button>
                            <button type="button" className="btn-cancel" onClick={() => setUrlInputIndex(null)}>
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : slot.status === 'loading' ? (
                    <div className="loading-wrap">
                      <Loader2 className="spin" size={22} />
                      <span>Procesando {slotLabel.toLowerCase()}</span>
                    </div>
                  ) : null}
                </div>
              );
            })}

            {canAddMore ? (
              <div className="bento-add">
                <div className="bento-add__copy">
                  <strong>Agregar otra</strong>
                  <span>Completa las 4 imágenes sin salir del bloque</span>
                </div>
                <div className="bento-add__actions">
                  <div className="slot-field">
                    <span className="slot-field__label">Ambiente</span>
                    <div className="slot-select-wrap">
                      <select
                        className="slot-select"
                        value={getResolvedLabel(firstEmptyIndex)}
                        onChange={(e) => updateSlotLabel(firstEmptyIndex, e.target.value as ImageLabel)}
                      >
                        {getAvailableLabels(firstEmptyIndex).map((label) => (
                          <option key={label} value={label}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button type="button" className="empty-action" onClick={() => openFilePicker(firstEmptyIndex)}>
                    <Upload size={14} />
                    Subir
                  </button>
                  <button type="button" className="empty-action" onClick={() => openUrlEditor(firstEmptyIndex)}>
                    <Link2 size={14} />
                    URL
                  </button>
                </div>
              </div>
            ) : null}

            {readyCount > 0 && urlInputIndex === firstEmptyIndex ? (
              <div className="url-input-wrap bento-url-popup" onClick={(e) => e.stopPropagation()}>
                <div className="url-header">
                  <span>Pegar enlace</span>
                  <span>Enter para confirmar</span>
                </div>
                <input
                  type="url"
                  placeholder="https://..."
                  value={urlValue}
                  onChange={(e) => setUrlValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleUrlSubmit(firstEmptyIndex);
                    }
                    if (e.key === 'Escape') setUrlInputIndex(null);
                  }}
                  autoFocus
                />
                <div className="url-actions">
                  <button type="button" className="btn-ok" onClick={() => handleUrlSubmit(firstEmptyIndex)}>
                    Ok
                  </button>
                  <button type="button" className="btn-cancel" onClick={() => setUrlInputIndex(null)}>
                    Cancelar
                  </button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
      {error && <div className="error-msg">{error}</div>}
    </div>
  );
}
