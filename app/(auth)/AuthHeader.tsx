export default function AuthHeader() {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(251,251,253,.82)',
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        borderBottom: '1px solid var(--line)',
      }}
    >
      <div
        style={{
          height: 64,
          display: 'grid',
          placeItems: 'center',
          width: '100%',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 19,
            fontWeight: 600,
            letterSpacing: '-0.022em',
          }}
        >
          <span
            style={{
              width: 26,
              height: 26,
              borderRadius: 8,
              background: 'var(--ink)',
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            R
          </span>
          RoomUNAP
        </div>
      </div>
    </header>
  );
}
