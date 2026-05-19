'use client';

import {
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, Eye, EyeOff, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import AuthShell from '../AuthShell';

type FieldName = 'email' | 'password';

type FormState = {
  email: string;
  password: string;
};

function validate(name: FieldName, state: FormState): boolean {
  switch (name) {
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email.trim());
    case 'password':
      return state.password.length >= 6;
  }
}

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [form, setForm] = useState<FormState>({
    email: '',
    password: '',
  });

  const [touched, setTouched] = useState<Record<FieldName, boolean>>({
    email: false,
    password: false,
  });

  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validity: Record<FieldName, boolean> = {
    email: validate('email', form),
    password: validate('password', form),
  };
  const formValid = Object.values(validity).every(Boolean);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((s) => ({ ...s, [key]: value }));
  }
  function markTouched(name: FieldName) {
    setTouched((t) => ({ ...t, [name]: true }));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!formValid || submitting) return;

    setSubmitError(null);
    setSubmitting(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.password,
      });

      if (error) {
        // Traducimos el error más común
        if (error.message.toLowerCase().includes('invalid')) {
          throw new Error('Correo o contraseña incorrectos.');
        }
        throw new Error(error.message);
      }

      // Login OK → al inicio
      router.push('/');
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Algo salió mal. Intenta de nuevo.';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function signInWithGoogle() {
    setSubmitError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw new Error(error.message);
    } catch (err) {
      const isCryptoError = err instanceof Error && err.message.includes('crypto');
      const msg = isCryptoError 
        ? 'Error de seguridad: Iniciar sesión con Google requiere HTTPS (o localhost). Tu navegador bloqueó la solicitud por estar usando una IP HTTP.' 
        : (err instanceof Error ? err.message : 'Error al conectar con Google.');
      setSubmitError(msg);
    }
  }

  return (
    <AuthShell className="rmu-login">
      <div>
          {/* Head */}
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <h1
              style={{
                margin: '0 0 10px',
                fontSize: 'clamp(28px, 4vw, 36px)',
                letterSpacing: '-0.025em',
                fontWeight: 600,
                lineHeight: 1.1,
              }}
            >
              Inicia sesión
            </h1>
            <p style={{ margin: 0, color: 'var(--muted-2)', fontSize: 16 }}>
              Bienvenido de vuelta a RoomUNAP.
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={onSubmit}
            noValidate
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--r-xl)',
              boxShadow: 'var(--shadow-md)',
              padding: 32,
            }}
          >
            <button
              type="button"
              onClick={signInWithGoogle}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                width: '100%',
                height: 48,
                borderRadius: 'var(--r-pill)',
                background: '#fff',
                border: '1px solid var(--line-strong)',
                color: 'var(--ink)',
                fontSize: 15,
                fontWeight: 500,
                cursor: 'pointer',
                marginBottom: 24,
                boxShadow: 'var(--shadow-sm)',
                transition: 'background .15s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = '#f9f9f9')}
              onMouseOut={(e) => (e.currentTarget.style.background = '#fff')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continuar con Google
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--line-strong)' }} />
              <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>O ingresa con tu correo</span>
              <div style={{ flex: 1, height: 1, background: 'var(--line-strong)' }} />
            </div>

            <Field
              label="Correo electrónico"
              error={touched.email && !validity.email && form.email.length > 0 ? 'Ingresa un correo válido.' : null}
            >
              <InputShell
                valid={validity.email && form.email.length > 0}
                invalid={touched.email && !validity.email && form.email.length > 0}
              >
                <input
                  type="email"
                  placeholder="ana@unap.edu.pe"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  onBlur={() => markTouched('email')}
                  style={inputStyle}
                />
                <ValidMark show={validity.email && form.email.length > 0} />
              </InputShell>
            </Field>

            <Field
              label="Contraseña"
              right={
                <Link
                  href="#"
                  style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500 }}
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              }
              error={touched.password && !validity.password && form.password.length > 0 ? 'Mínimo 6 caracteres.' : null}
            >
              <InputShell
                valid={validity.password && form.password.length > 0}
                invalid={touched.password && !validity.password && form.password.length > 0}
              >
                <input
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••"
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  onBlur={() => markTouched('password')}
                  style={inputStyle}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  style={{
                    flex: '0 0 auto',
                    width: 36,
                    height: 36,
                    marginRight: 6,
                    display: 'grid',
                    placeItems: 'center',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--muted)',
                    borderRadius: '50%',
                  }}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </InputShell>
            </Field>

            {submitError && (
              <div
                style={{
                  marginTop: 8,
                  padding: '10px 14px',
                  borderRadius: 'var(--r-md)',
                  border: '1px solid rgba(255,59,48,.3)',
                  background: 'rgba(255,59,48,.06)',
                  color: 'var(--danger)',
                  fontSize: 13,
                }}
              >
                {submitError}
              </div>
            )}

            <button
              type="submit"
              disabled={!formValid || submitting}
              className="rmu-btn-primary"
              style={{
                marginTop: 20,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                width: '100%',
                height: 48,
                padding: '0 26px',
                borderRadius: 'var(--r-pill)',
                fontSize: 15,
                fontWeight: 500,
                background: 'var(--accent)',
                color: '#fff',
                border: 'none',
                cursor: !formValid || submitting ? 'not-allowed' : 'pointer',
                opacity: !formValid || submitting ? 0.45 : 1,
                whiteSpace: 'nowrap',
                transition: 'background .15s, opacity .15s',
              }}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="rmu-spin" />
                  Iniciando sesión…
                </>
              ) : (
                'Iniciar sesión'
              )}
            </button>

            <p style={{ marginTop: 18, textAlign: 'center', fontSize: 13, color: 'var(--muted-2)' }}>
              ¿Aún no tienes cuenta?{' '}
              <Link href="/registro" style={{ color: 'var(--accent)', fontWeight: 500 }}>
                Crear cuenta
              </Link>
            </p>
          </form>
      </div>

      <style jsx global>{`
        @keyframes rmu-spin {
          to {
            transform: rotate(360deg);
          }
        }
        .rmu-spin {
          animation: rmu-spin 0.8s linear infinite;
        }
        .rmu-login .rmu-back:hover {
          background: var(--surface-2);
          color: var(--ink);
        }
        .rmu-login .rmu-input-shell {
          position: relative;
          display: flex;
          align-items: center;
          background: var(--surface);
          border: 1px solid var(--line-strong);
          border-radius: var(--r-md);
          transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
        }
        .rmu-login .rmu-input-shell:hover {
          border-color: rgba(0, 0, 0, 0.28);
        }
        .rmu-login .rmu-input-shell:focus-within {
          border-color: var(--accent);
          box-shadow: 0 0 0 4px rgba(0, 113, 227, 0.12);
        }
        .rmu-login .rmu-input-shell.invalid {
          border-color: var(--danger);
          background: rgba(255, 59, 48, 0.06);
        }
        .rmu-login .rmu-btn-primary:not(:disabled):hover {
          background: var(--accent-press);
        }
        @media (max-width: 640px) {
          .rmu-login header > div,
          .rmu-login main > div {
            padding: 0 20px !important;
          }
        }
      `}</style>
    </AuthShell>
  );
}

const inputStyle: CSSProperties = {
  flex: '1 1 auto',
  width: '100%',
  border: 'none',
  background: 'transparent',
  outline: 'none',
  padding: '14px 16px',
  fontSize: 16,
  letterSpacing: '-0.005em',
  color: 'var(--ink)',
  minWidth: 0,
  fontFamily: 'inherit',
};

function Field({
  label,
  right,
  error,
  children,
}: {
  label: string;
  right?: ReactNode;
  error?: string | null;
  children: ReactNode;
}) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <label style={{ fontSize: 14, fontWeight: 500, letterSpacing: '-0.005em', color: 'var(--ink)' }}>
          {label}
        </label>
        {right}
      </div>
      {children}
      {error && (
        <div style={{ marginTop: 6, fontSize: 12, color: 'var(--danger)', letterSpacing: '-0.005em' }}>{error}</div>
      )}
    </div>
  );
}

function InputShell({
  children,
  valid,
  invalid,
}: {
  children: ReactNode;
  valid?: boolean;
  invalid?: boolean;
}) {
  const className = ['rmu-input-shell', invalid ? 'invalid' : '', valid ? 'valid' : ''].filter(Boolean).join(' ');
  return <div className={className}>{children}</div>;
}

function ValidMark({ show }: { show: boolean }) {
  return (
    <div
      aria-hidden
      style={{
        flex: '0 0 auto',
        width: 22,
        height: 22,
        borderRadius: '50%',
        background: '#34C759',
        display: 'grid',
        placeItems: 'center',
        marginRight: 12,
        opacity: show ? 1 : 0,
        transform: show ? 'scale(1)' : 'scale(.6)',
        transition: 'opacity .18s ease, transform .18s ease',
        pointerEvents: 'none',
      }}
    >
      <Check size={12} color="#fff" strokeWidth={3} />
    </div>
  );
}       
