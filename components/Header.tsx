import { } from 'lucide-react';

export default function Header() {
    return (
        <header style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            zIndex: 100,
            borderBottom: '1px solid var(--color-border)',
            background: 'rgba(18, 18, 26, 0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
        }}>
            <div className="container" style={{
                height: '72px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src="/logo.png" alt="CV Hero Logo" style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)' }} />
                    <div>
                        <h1 style={{
                            fontSize: '1.25rem',
                            fontWeight: '700',
                            color: 'var(--color-text)',
                            letterSpacing: '-0.02em',
                            lineHeight: '1.2'
                        }}>
                            CV Hero
                        </h1>
                        <span style={{
                            fontSize: '0.7rem',
                            color: 'var(--color-primary)',
                            fontFamily: 'var(--font-mono)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em'
                        }}>
                            AI-Powered
                        </span>
                    </div>
                </div>
                <nav style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{
                        fontSize: '0.75rem',
                        color: 'var(--color-text-muted)',
                        fontFamily: 'var(--font-mono)'
                    }}>
                        v1.0
                    </span>
                </nav>
            </div>
        </header>
    );
}
