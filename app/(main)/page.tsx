import HomeListings from '@/components/HomeListings';
import { createClient } from '@/lib/supabase/server';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: listings, error } = await supabase
    .from('listings')
    .select('id, owner_id, title, description, price, zone, image_url, status, is_verified, is_new, features, created_at')
    .order('created_at', { ascending: false })
    .limit(24);

  return (
    <main className="container-apple">
      <section className="hero">
        <h1>
          Tu habitación en Puno,
          <br />
          <em>más cerca que nunca.</em>
        </h1>
        <p>
          Cientos de cuartos verificados a pocos minutos de la UNAP. Filtra por zona, presupuesto y comodidades - sin
          comisiones ocultas.
        </p>
      </section>

      <HomeListings listings={listings ?? []} errorMessage={error?.message ?? null} />
    </main>
  );
}
