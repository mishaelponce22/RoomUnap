'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/types/database';

export type FavoriteRecord = {
  id: string;
  savedAt: string;
};

type FavoriteRow = Database['public']['Tables']['favorites']['Row'];

const FAVORITES_EVENT = 'roomunap:favorites-change';
const EMPTY_FAVORITES: FavoriteRecord[] = [];
let cachedFavorites: FavoriteRecord[] = [];

// Instancia global de Supabase para el store
const supabase = typeof window !== 'undefined' ? createClient() : null;

async function loadFavoritesFromServer(userId: string) {
  if (!supabase) return;
  const { data, error } = await supabase
    .from('favorites')
    .select('listing_id, created_at')
    .eq('user_id', userId);

  if (!error && data) {
    cachedFavorites = (data as Pick<FavoriteRow, 'listing_id' | 'created_at'>[]).map((d) => ({
      id: d.listing_id,
      savedAt: d.created_at,
    }));
    window.dispatchEvent(new Event(FAVORITES_EVENT));
  }
}

if (typeof window !== 'undefined' && supabase) {
  // Suscribirse a cambios de autenticación para cargar o limpiar favoritos
  supabase.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
      loadFavoritesFromServer(session.user.id);
    } else {
      cachedFavorites = [];
      window.dispatchEvent(new Event(FAVORITES_EVENT));
    }
  });

  // Carga inicial
  supabase.auth.getUser().then(({ data }) => {
    if (data?.user) {
      loadFavoritesFromServer(data.user.id);
    }
  });
}

function readFavorites(): FavoriteRecord[] {
  return cachedFavorites;
}

function subscribeToFavorites(onStoreChange: () => void) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  window.addEventListener(FAVORITES_EVENT, onStoreChange);

  return () => {
    window.removeEventListener(FAVORITES_EVENT, onStoreChange);
  };
}

export function getStoredFavorites(): FavoriteRecord[] {
  return readFavorites();
}

function getServerFavorites() {
  return EMPTY_FAVORITES;
}

export function useFavorites() {
  const favorites = useSyncExternalStore(subscribeToFavorites, readFavorites, getServerFavorites);

  const favoriteIds = useMemo(() => favorites.map((item) => item.id), [favorites]);

  const refresh = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new Event(FAVORITES_EVENT));
  }, []);

  const isFavorite = useCallback(
    (id: string) => favorites.some((item) => item.id === id),
    [favorites]
  );

  const toggleFavorite = useCallback(async (id: string) => {
    if (!supabase) return;
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) {
      alert('Debes iniciar sesión para guardar favoritos.');
      return;
    }

    const userId = authData.user.id;
    const current = readFavorites();
    const existing = current.find((item) => item.id === id);

    if (existing) {
      // Optimistic update: remove from local state
      cachedFavorites = current.filter((item) => item.id !== id);
      window.dispatchEvent(new Event(FAVORITES_EVENT));

      // Remove from server
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('listing_id', id);

      if (error) {
        console.error('Error al eliminar favorito:', error);
        cachedFavorites = current;
        window.dispatchEvent(new Event(FAVORITES_EVENT));
      }
    } else {
      // Optimistic update: add to local state
      const newRecord = { id, savedAt: new Date().toISOString() };
      cachedFavorites = [newRecord, ...current];
      window.dispatchEvent(new Event(FAVORITES_EVENT));

      // Add to server
      const { error } = await supabase
        .from('favorites')
        .insert({ user_id: userId, listing_id: id });
        
      if (error) {
        // Revertir si falla
        console.error('Error al guardar favorito:', error);
        cachedFavorites = current;
        window.dispatchEvent(new Event(FAVORITES_EVENT));
      }
    }
  }, []);

  // Compatibilidad: mapeamos addFavorite y removeFavorite a toggleFavorite
  // ya que nuestra nueva lógica centralizada en toggleFavorite es suficiente
  const addFavorite = useCallback(async (id: string) => {
    if (!isFavorite(id)) await toggleFavorite(id);
  }, [isFavorite, toggleFavorite]);

  const removeFavorite = useCallback(async (id: string) => {
    if (isFavorite(id)) await toggleFavorite(id);
  }, [isFavorite, toggleFavorite]);

  return {
    favorites,
    favoriteIds,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    refresh,
  };
}
