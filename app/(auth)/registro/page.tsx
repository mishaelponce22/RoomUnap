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

type FieldName = 'fullName' | 'email' | 'password' | 'role';

type FormState = {
  fullName: string;
  email: string;
  password: string;
  role: 'estudiante' | 'arrendador' | '';
};

function validate(name: FieldName, state: FormState): boolean {
  switch (name) {
    case 'fullName':
      return state.fullName.trim().length >= 3;
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email.trim());
    case 'password':
      return state.password.length >= 6;
    case 'role':
      return state.role !== '';
  }
}

export default function RegistroPage() {
  const router = useRouter();
  const supabase = createClient();

  const [form, setForm] = useState<FormState>({
    fullName: '',
    email: '',
    password: '',
    role: '',
  });

  const [touched, setTouched] = useState<Record<FieldName, boolean>>({
    fullName: false,
    email: false,
    password: false,
    role: false,
  });

  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const validity: Record<FieldName, boolean> = {
    fullName: validate('fullName', form),
    email: validate('email', form),
    password: validate('password', form),
    role: validate('role', form),
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
    setTouched({ fullName: true, email: true, password: true, role: true });
    if (!formValid || submitting) return;

    setSubmitError(null);
    setSubmitting(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          data: {
            full_name: form.fullName.trim(),
            role: form.role,
          },
        },
      });

      if (error) throw new Error(error.message);

      setShowSuccess(true);
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
        ? 'Error de seguridad: El registro con Google requiere HTTPS (o localhost). Tu navegador bloqueó la solicitud por estar usando una IP HTTP.' 
        : (err instanceof Error ? err.message : 'Error al conectar con Google.');
      setSubmitError(msg);
    }
  }

  return (
    <AuthShell className="rmu-registro">
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
              Crea tu cuenta
            </h1>
            <p style={{ margin: 0, color: 'var(--muted-2)', fontSize: 16 }}>
              Únete a RoomUNAP para encontrar o publicar habitaciones.
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
              <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>O regístrate con correo</span>
              <div style={{ flex: 1, height: 1, background: 'var(--line-strong)' }} />
            </div>

            <Field
              label="Nombre completo"
              error={touched.fullName && !validity.fullName && form.fullName.length > 0 ? 'Ingresa tu nombre (mín. 3 caracteres).' : null}
            >
              <InputShell
                valid={validity.fullName && form.fullName.length > 0}
                invalid={touched.fullName && !validity.fullName && form.fullName.length > 0}
              >
                <input
                  type="text"
                  placeholder="Ana López"
                  autoComplete="name"
                  value={form.fullName}
                  onChange={(e) => update('fullName', e.target.value)}
                  onBlur={() => markTouched('fullName')}
                  style={inputStyle}
                />
                <ValidMark show={validity.fullName && form.fullName.length > 0} />
              </InputShell>
            </Field>

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
              right={<span style={{ fontSize: 12, color: 'var(--muted)' }}>Mín. 6 caracteres</span>}
              error={touched.password && !validity.password && form.password.length > 0 ? 'Mínimo 6 caracteres.' : null}
            >
              <InputShell
                valid={validity.password && form.password.length > 0}
                invalid={touched.password && !validity.password && form.password.length > 0}
              >
                <input
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••"
                  autoComplete="new-password"
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

            <Field
              label="¿Cómo vas a usar RoomUNAP?"
              error={touched.role && !validity.role ? 'Selecciona una opción.' : null}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <RoleCard
                  selected={form.role === 'estudiante'}
                  onClick={() => {
                    update('role', 'estudiante');
                    markTouched('role');
                  }}
                  title="Estudiante"
                  desc="Busco habitación"
                />
                <RoleCard
                  selected={form.role === 'arrendador'}
                  onClick={() => {
                    update('role', 'arrendador');
                    markTouched('role');
                  }}
                  title="Arrendador"
                  desc="Ofrezco habitación"
                />
              </div>
            </Field>

            {submitError && (
              <div
                style={{
                  marginTop: 20,
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
                marginTop: 28,
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
                  Creando cuenta…
                </>
              ) : (
                'Crear cuenta'
              )}
            </button>

            <p style={{ marginTop: 18, textAlign: 'center', fontSize: 13, color: 'var(--muted-2)' }}>
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 500 }}>
                Inicia sesión
              </Link>
            </p>
          </form>

            <p
              style={{
                marginTop: 24,
                textAlign: 'center',
              fontSize: 12,
              color: 'var(--muted)',
              maxWidth: 400,
              marginLeft: 'auto',
              marginRight: 'auto',
              lineHeight: 1.55,
            }}
          >
            Al crear tu cuenta aceptas nuestros{' '}
            <Link href="#" style={{ color: 'var(--ink-2)', textDecoration: 'underline', textUnderlineOffset: 3 }}>
              Términos
            </Link>{' '}
            y{' '}
            <Link href="#" style={{ color: 'var(--ink-2)', textDecoration: 'underline', textUnderlineOffset: 3 }}>
              Política de privacidad
            </Link>
            .
          </p>
      </div>

      {/* Modal de éxito */}
      {showSuccess && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 120,
            background: 'rgba(0,0,0,.45)',
            backdropFilter: 'blur(6px)',
            display: 'grid',
            placeItems: 'center',
            padding: 20,
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 24,
              maxWidth: 420,
              width: '100%',
              padding: '32px 28px 24px',
              boxShadow: 'var(--shadow-lg)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: '#34C759',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 14px',
              }}
            >
              <Check size={28} color="#fff" strokeWidth={3} />
            </div>
            <h3 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 600, letterSpacing: '-0.015em' }}>
              ¡Cuenta creada!
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: 14, color: 'var(--muted-2)' }}>
              Tu cuenta fue creada con éxito. Ya puedes empezar a usar RoomUNAP.
            </p>
            <button
              onClick={() => router.push('/')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: 48,
                padding: '0 26px',
                borderRadius: 'var(--r-pill)',
                fontSize: 15,
                fontWeight: 500,
                background: 'var(--accent)',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Ir al inicio
            </button>
          </div>
        </div>
      )}

      {/* Estilos locales */}
      <style jsx global>{`
        @keyframes rmu-spin {
          to {
            transform: rotate(360deg);
          }
        }
        .rmu-spin {
          animation: rmu-spin 0.8s linear infinite;
        }
        .rmu-registro .rmu-input-shell {
          position: relative;
          display: flex;
          align-items: center;
          background: var(--surface);
          border: 1px solid var(--line-strong);
          border-radius: var(--r-md);
          transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
        }
        .rmu-registro .rmu-input-shell:hover {
          border-color: rgba(0, 0, 0, 0.28);
        }
        .rmu-registro .rmu-input-shell:focus-within {
          border-color: var(--accent);
          box-shadow: 0 0 0 4px rgba(0, 113, 227, 0.12);
        }
        .rmu-registro .rmu-input-shell.invalid {
          border-color: var(--danger);
          background: rgba(255, 59, 48, 0.06);
        }
        .rmu-registro .rmu-btn-primary:not(:disabled):hover {
          background: var(--accent-press);
        }
        @media (max-width: 640px) {
          .rmu-registro header > div,
          .rmu-registro main > div {
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

function RoleCard({
  selected,
  onClick,
  title,
  desc,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        textAlign: 'left',
        padding: '14px 16px',
        borderRadius: 'var(--r-md)',
        border: `1.5px solid ${selected ? 'var(--accent)' : 'var(--line-strong)'}`,
        background: selected ? 'rgba(0,113,227,.06)' : 'var(--surface)',
        cursor: 'pointer',
        transition: 'border-color .15s, background .15s',
        fontFamily: 'inherit',
      }}
    >
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--ink)',
          marginBottom: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        {selected && <Check size={14} color="var(--accent)" strokeWidth={3} />}
        {title}
      </div>
      <div style={{ fontSize: 12, color: 'var(--muted-2)' }}>{desc}</div>
    </button>
  );
}
