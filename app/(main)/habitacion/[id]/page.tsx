import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Listing } from '@/lib/types/database';
import HabitacionClient from './HabitacionClient';

export default async function HabitacionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('listings')
    .select('id, owner_id, title, description, price, zone, image_url, status, is_verified, is_new, features, created_at')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Error cargando listing:', error.message);
    notFound();
  }
  if (!data) notFound();

  const listing = data as Listing;

  return <HabitacionClient listing={listing} />;
}
