'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, User, Shield, Settings } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function UserMenu() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [sessionUser, setSessionUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) {
        if (session?.user) {
          setSessionUser(session.user);
        }
        setIsLoading(false);
      }
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSessionUser(session?.user ?? null);
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showMenu]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowMenu(false);
    router.push('/login');
  };

  let initials = 'U';
  let fullName = 'Usuario';
  let role = 'Invitado';
  let email = '';

  if (sessionUser) {
    email = sessionUser.email || '';
    fullName = sessionUser.user_metadata?.full_name || email.split('@')[0] || 'Usuario';
    role = sessionUser.user_metadata?.role || 'estudiante';
    
    role = role.charAt(0).toUpperCase() + role.slice(1);

    const parts = fullName.split(' ').filter(Boolean);
    if (parts.length > 1) {
      initials = (parts[0][0] + parts[1][0]).toUpperCase();
    } else if (parts.length === 1) {
      initials = parts[0].substring(0, 2).toUpperCase();
    }
  }

  if (isLoading) {
    return (
      <div className="nav-user" style={{ opacity: 0.5, animation: 'pulse 1.5s infinite' }}>
        <span style={{ opacity: 0 }}>U</span>
      </div>
    );
  }

  if (!sessionUser) {
    return (
      <Link href="/login" className="nav-user" title="Iniciar sesión" style={{ textDecoration: 'none', display: 'grid', placeItems: 'center' }}>
        <User size={16} />
      </Link>
    );
  }

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      <button 
        className="nav-user" 
        title="Mi cuenta" 
        onClick={() => setShowMenu((prev) => !prev)}
        style={{ 
          border: 'none', 
          cursor: 'pointer', 
          fontFamily: 'inherit',
          padding: 0,
          outline: showMenu ? '2px solid var(--accent)' : 'none',
          outlineOffset: '2px',
          transition: 'outline 0.2s ease',
          background: 'var(--surface-2)',
          color: 'var(--ink)',
          display: 'grid',
          placeItems: 'center',
          fontWeight: 600,
          fontSize: '14px'
        }}
      >
        {initials}
      </button>

      {showMenu && (
        <div 
          className="profile-popover"
          style={{
            position: 'absolute',
            top: 'calc(100% + 12px)',
            right: 0,
            width: '280px',
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(0,0,0,0.08)',
            borderRadius: '16px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.05)',
            overflow: 'hidden',
            zIndex: 100,
            animation: 'popoverIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            transformOrigin: 'top right'
          }}
        >
          <div style={{ padding: '16px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div 
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--accent), #005bb5)',
                  color: '#fff',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '16px',
                  fontWeight: 600,
                  flexShrink: 0,
                  boxShadow: 'inset 0 -2px 6px rgba(0,0,0,0.1)'
                }}
              >
                {initials}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.01em' }}>
                  {fullName}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--muted-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {email}
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding: '8px' }}>
            <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: 'var(--ink)' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--surface-2)', display: 'grid', placeItems: 'center' }}>
                <Shield size={16} color="var(--accent)" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: '12px', color: 'var(--muted-2)', lineHeight: 1 }}>Rol de la cuenta</span>
                <span style={{ fontWeight: 500, fontSize: '14px', lineHeight: 1 }}>{role}</span>
              </div>
            </div>
          </div>

          <div style={{ padding: '8px', borderTop: '1px solid rgba(0,0,0,0.08)' }}>
            {sessionUser?.user_metadata?.role === 'super_admin' && (
              <Link
                href="/admin"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '10px',
                  color: 'var(--ink)',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  textDecoration: 'none',
                  marginBottom: '4px'
                }}
                onClick={() => setShowMenu(false)}
              >
                <Settings size={16} />
                Panel de Admin
              </Link>
            )}
            <button 
              onClick={handleLogout}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px',
                background: 'transparent',
                border: 'none',
                borderRadius: '10px',
                color: 'var(--danger)',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.15s, transform 0.1s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 59, 48, 0.08)'}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <LogOut size={16} />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
