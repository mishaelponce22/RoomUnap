import type { ReactNode } from 'react';
import AuthHeader from './AuthHeader';

type AuthShellProps = {
  className: string;
  children: ReactNode;
  maxWidth?: number;
};

export default function AuthShell({ className, children, maxWidth = 480 }: AuthShellProps) {
  return (
    <div className={className} style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--ink)' }}>
      <AuthHeader />

      <main
        style={{
          padding: '48px 32px 96px',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div style={{ width: '100%', maxWidth: maxWidth }}>{children}</div>
      </main>
    </div>
  );
}
