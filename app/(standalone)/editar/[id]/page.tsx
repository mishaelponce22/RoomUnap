import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Listing } from '@/lib/types/database';
import EditRoomClient from './EditRoomClient';

type EditRoomPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditRoomPage({ params }: EditRoomPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: listing, error } = await supabase
    .from('listings')
    .select('id, owner_id, title, description, price, zone, image_url, status, is_verified, is_new, features, created_at')
    .eq('id', id)
    .maybeSingle();

  if (error || !listing) {
    notFound();
  }

  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    redirect('/login');
  }

  if (authData.user.id !== listing.owner_id) {
    redirect('/');
  }

  return <EditRoomClient listing={listing as Listing} />;
}
