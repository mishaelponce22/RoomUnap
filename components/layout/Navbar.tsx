'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import Brand from './Brand';
import UserMenu from './UserMenu';

export default function Navbar() {
  const pathname = usePathname();
  const showFavorites = pathname !== '/favoritos';
  const supabase = useMemo(() => createClient(), []);

  const [sessionUser, setSessionUser] = useState<User | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSessionUser(session?.user ?? null);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);
  let role = 'Invitado';

  if (sessionUser) {
    role = sessionUser.user_metadata?.role || 'estudiante';
    
    // Capitalizar rol
    role = role.charAt(0).toUpperCase() + role.slice(1);
  }

  return (
    <header
      className="nav navbar-blur"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
      }}
    >
      <div className="container nav-inner">
        <div className="nav-search-shell">
          <div className="nav-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7"/>
              <path d="m21 21-4.3-4.3"/>
            </svg>
            <input id="navSearch" type="search" placeholder="Buscar por zona, universidad o palabra clave…" />
          </div>
        </div>

        <Brand />

        <div className="nav-actions">
          {showFavorites ? (
            <Link href="/favoritos" className="btn btn-ghost icon-btn-mobile" aria-label="Mis favoritos" title="Mis favoritos" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              <span className="hide-on-mobile">Favoritos</span>
            </Link>
          ) : null}
          
          {role.toLowerCase() === 'arrendador' ? (
            <Link href="/publicar" className="btn btn-primary icon-btn-mobile" style={{ textDecoration: 'none', padding: '0 14px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M12 5v14M5 12h14"/>
              </svg>
              <span className="hide-on-mobile">Publicar</span>
            </Link>
          ) : null}
          
          <UserMenu />
        </div>

      </div>
      <style jsx global>{`
        @keyframes popoverIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-8px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes pulse {
          0% { opacity: 0.5; }
          50% { opacity: 0.8; }
          100% { opacity: 0.5; }
        }
      `}</style>
    </header>
  );
}
