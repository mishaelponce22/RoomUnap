import type { Json } from '@/lib/types/database';

export const IMAGE_ENV_LABELS = ['Habitación', 'Cocina', 'Sala', 'Baño'] as const;

export type ImageLabel = (typeof IMAGE_ENV_LABELS)[number];

export type ListingGalleryImage = {
  src: string;
  label: ImageLabel;
};

export type StoredImageSlot = {
  label: ImageLabel;
  url: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeUrl(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function isImageLabel(value: unknown): value is ImageLabel {
  return typeof value === 'string' && (IMAGE_ENV_LABELS as readonly string[]).includes(value);
}

function getLabelRank(label: ImageLabel) {
  return IMAGE_ENV_LABELS.indexOf(label);
}

function orderSlotsByLabel(slots: StoredImageSlot[]) {
  return [...slots].sort((a, b) => getLabelRank(a.label) - getLabelRank(b.label));
}

export function getDefaultImageLabel(index: number): ImageLabel {
  return IMAGE_ENV_LABELS[Math.min(index, IMAGE_ENV_LABELS.length - 1)];
}

export function getStoredImageSlots(features: Json | null): StoredImageSlot[] {
  if (!isRecord(features) || !Array.isArray(features.image_slots)) return [];

  return features.image_slots
    .map((entry, index) => {
      if (!isRecord(entry)) return null;
      const url = normalizeUrl(entry.url ?? entry.previewUrl ?? entry.remoteUrl ?? entry.src);
      if (!url) return null;
      const label = isImageLabel(entry.label) ? entry.label : getDefaultImageLabel(index);
      return { label, url };
    })
    .filter((slot): slot is StoredImageSlot => Boolean(slot));
}

export function getEditorImageSeeds(params: { imageUrl?: string | null; features?: Json | null }) {
  const stored = getStoredImageSlots(params.features ?? null);
  if (stored.length > 0) {
    const ordered = orderSlotsByLabel(stored);
    const main = normalizeUrl(params.imageUrl);
    const hasMain = ordered.some((slot) => slot.label === 'Habitación');
    const finalSlots = !hasMain && main ? [{ label: 'Habitación' as const, url: main }, ...ordered] : ordered;
    return finalSlots.slice(0, IMAGE_ENV_LABELS.length);
  }

  const seeds: StoredImageSlot[] = [];
  const main = normalizeUrl(params.imageUrl);
  if (main) {
    seeds.push({ label: 'Habitación', url: main });
  }

  if (isRecord(params.features) && Array.isArray(params.features.image_urls)) {
    params.features.image_urls.forEach((value, index) => {
      const url = normalizeUrl(value);
      if (url) {
        seeds.push({ label: getDefaultImageLabel(index + 1), url });
      }
    });
  }

  return seeds.slice(0, IMAGE_ENV_LABELS.length);
}

export function getListingGalleryImages(params: { imageUrl?: string | null; features?: Json | null }): ListingGalleryImage[] {
  const stored = getStoredImageSlots(params.features ?? null);
  if (stored.length > 0) {
    const ordered = orderSlotsByLabel(stored);
    const main = normalizeUrl(params.imageUrl);
    const hasMain = ordered.some((slot) => slot.label === 'Habitación');
    const finalSlots = !hasMain && main ? [{ label: 'Habitación' as const, url: main }, ...ordered] : ordered;
    return finalSlots.map((slot, index) => ({
      src: slot.url,
      label: slot.label || getDefaultImageLabel(index),
    }));
  }

  const fallback: ListingGalleryImage[] = [];
  const mainUrl = normalizeUrl(params.imageUrl);
  if (mainUrl) {
    fallback.push({ src: mainUrl, label: 'Habitación' });
  }

  if (isRecord(params.features) && Array.isArray(params.features.image_urls)) {
    params.features.image_urls.forEach((value, index) => {
      const url = normalizeUrl(value);
      if (url) {
        fallback.push({ src: url, label: getDefaultImageLabel(index + 1) });
      }
    });
  }

  return fallback;
}
