import Link from 'next/link';
import Brand from './Brand';
import { createClient } from '@/lib/supabase/server';

export default async function Footer() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = user?.user_metadata?.role || 'estudiante';
  const isArrendador = role === 'arrendador';

  return (
    <footer>
      <div className="container">
        <div className="foot-grid">
          
          <div className="foot-about">
            <Brand />
            <p>La forma más simple de encontrar (o publicar) una habitación cerca de la Universidad Nacional del Altiplano, Puno.</p>
          </div>
          
          <div className="foot-col">
            <h4>Explora</h4>
            <ul>
              <li><Link href="/?zona=Centro">Centro</Link></li>
              <li><Link href="/?zona=Bellavista">Bellavista</Link></li>
              <li><Link href="/?zona=Salcedo">Salcedo</Link></li>
              <li><Link href="/?zona=Chanu">Chanu Chanu</Link></li>
              <li><Link href="/favoritos">Mis favoritos</Link></li>
            </ul>
          </div>
          
          {isArrendador && (
            <div className="foot-col">
              <h4>Anfitriones</h4>
              <ul>
                <li><Link href="/publicar">Publicar habitación</Link></li>
                <li><Link href="#">Guía del anfitrión</Link></li>
                <li><Link href="#">Verificación</Link></li>
              </ul>
            </div>
          )}
          
          <div className="foot-col">
            <h4>Soporte</h4>
            <ul>
              <li><Link href="#">Centro de ayuda</Link></li>
              <li><Link href="#">Contacto</Link></li>
              <li><Link href="#">Seguridad</Link></li>
            </ul>
          </div>

        </div>
        
        <div className="foot-bottom">
          <span>© 2026 RoomUNAP · Puno, Perú</span>
          <span className="links">
            <Link href="#">Términos</Link>
            <Link href="#">Privacidad</Link>
            <Link href="#">Cookies</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
