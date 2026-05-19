'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Helper to verify if the current user is a super_admin
export async function verifySuperAdmin() {
  const supabase = await createServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('No autorizado. Por favor inicie sesión.');
  }

  // Comprobar rol en metadata
  const isSuperAdmin = user.user_metadata?.role === 'super_admin';
  if (!isSuperAdmin) {
    throw new Error('Acceso denegado. Se requiere rol de super_admin.');
  }

  return user;
}

export async function getAdminDashboardStats() {
  await verifySuperAdmin();
  const adminClient = createAdminClient();

  const [usersCount, listingsCount] = await Promise.all([
    adminClient.from('users').select('*', { count: 'exact', head: true }),
    adminClient.from('listings').select('*', { count: 'exact', head: true })
  ]);

  return {
    totalUsers: usersCount.count || 0,
    totalListings: listingsCount.count || 0
  };
}

export async function getAllUsers() {
  await verifySuperAdmin();
  const adminClient = createAdminClient();

  const { data: users, error } = await adminClient
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return users || [];
}

export async function deleteUser(userId: string) {
  await verifySuperAdmin();
  const adminClient = createAdminClient();

  // Borrar de public.users
  const { error: dbError } = await adminClient
    .from('users')
    .delete()
    .eq('id', userId);

  if (dbError) throw new Error(`Error borrando usuario de DB: ${dbError.message}`);

  // Borrar de auth.users (requiere service_role)
  const { error: authError } = await adminClient.auth.admin.deleteUser(userId);
  if (authError) throw new Error(`Error borrando usuario de Auth: ${authError.message}`);

  revalidatePath('/admin/users');
  return { success: true };
}

export async function updateUserRole(userId: string, newRole: 'estudiante' | 'arrendador' | 'super_admin') {
  await verifySuperAdmin();
  const adminClient = createAdminClient();

  // Actualizar public.users
  const { error: dbError } = await adminClient
    .from('users')
    .update({ role: newRole })
    .eq('id', userId);

  if (dbError) throw new Error(`Error actualizando rol en DB: ${dbError.message}`);

  // Actualizar user_metadata en auth.users
  const { error: authError } = await adminClient.auth.admin.updateUserById(userId, {
    user_metadata: { role: newRole }
  });

  if (authError) throw new Error(`Error actualizando metadata: ${authError.message}`);

  revalidatePath('/admin/users');
  return { success: true };
}

export async function getAllListingsAdmin() {
  await verifySuperAdmin();
  const adminClient = createAdminClient();

  const { data: listings, error } = await adminClient
    .from('listings')
    .select('*, owner:users!owner_id(full_name, email)')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return listings || [];
}

export async function updateListingStatus(listingId: string, newStatus: 'active' | 'inactive' | 'rented') {
  await verifySuperAdmin();
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from('listings')
    .update({ status: newStatus })
    .eq('id', listingId);

  if (error) throw new Error(error.message);

  revalidatePath('/admin/listings');
  revalidatePath('/habitaciones');
  return { success: true };
}

export async function deleteListingAdmin(listingId: string) {
  await verifySuperAdmin();
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from('listings')
    .delete()
    .eq('id', listingId);

  if (error) throw new Error(error.message);

  revalidatePath('/admin/listings');
  revalidatePath('/habitaciones');
  return { success: true };
}
