import Link from 'next/link';

export default function EditarIndexPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--ink)',
        display: 'grid',
        placeItems: 'center',
        padding: '32px 20px',
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: 720,
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--r-xl)',
          boxShadow: 'var(--shadow-md)',
          padding: 32,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '4px 12px',
            borderRadius: 'var(--r-pill)',
            background: 'var(--accent-soft)',
            color: 'var(--accent)',
            fontSize: 12,
            fontWeight: 500,
            marginBottom: 16,
          }}
        >
          Editar publicación
        </div>
        <h1
          style={{
            margin: '0 0 10px',
            fontSize: 'clamp(28px, 4vw, 36px)',
            letterSpacing: '-0.025em',
            lineHeight: 1.1,
          }}
        >
          Abre una habitación para editarla
        </h1>
        <p style={{ margin: '0 auto 24px', maxWidth: 520, color: 'var(--muted-2)', fontSize: 16 }}>
          El enlace de edición necesita el ID de una publicación. Entra a una habitación y presiona “Editar” desde su
          vista de detalle.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: 48,
              padding: '0 24px',
              borderRadius: 'var(--r-pill)',
              background: 'var(--accent)',
              color: '#fff',
              fontWeight: 500,
            }}
          >
            Ir al inicio
          </Link>
          <Link
            href="/publicar"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: 48,
              padding: '0 24px',
              borderRadius: 'var(--r-pill)',
              border: '1px solid var(--line-strong)',
              background: '#fff',
              color: 'var(--ink-2)',
              fontWeight: 500,
            }}
          >
            Publicar habitación
          </Link>
        </div>
      </section>
    </main>
  );
}
