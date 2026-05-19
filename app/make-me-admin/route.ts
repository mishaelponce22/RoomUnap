import { createClient as createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'No has iniciado sesión en RoomUNAP. Inicia sesión primero.' }, { status: 401 });
    }

    const adminClient = createAdminClient();

    // Actualizar metadata de autenticación
    const { error: authError } = await adminClient.auth.admin.updateUserById(user.id, {
      user_metadata: { role: 'super_admin' }
    });

    if (authError) {
      return NextResponse.json({ error: `Error en Auth: ${authError.message}` }, { status: 500 });
    }

    // Asegurarse de que el usuario existe en public.users antes de actualizar
    const { data: existingUser } = await adminClient
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();

    if (existingUser) {
      const { error: dbError } = await adminClient
        .from('users')
        .update({ role: 'super_admin' })
        .eq('id', user.id);

      if (dbError) {
        return NextResponse.json({ error: `Error en DB: ${dbError.message}` }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: '¡Felicidades! Tu cuenta ahora es Super Admin.',
      instructions: 'Vuelve a la aplicación (localhost:3000), CIERRA SESIÓN y VUELVE A INICIAR SESIÓN para que aparezca el botón del panel.'
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
