"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
    const pathname = usePathname();

    const navLinks = [
        { href: '/', label: 'CV Optimizer' },
        { href: '/cover-letter', label: 'Cover Letter' },
    ];

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
                            <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>
                                CV Hero
                            </Link>
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
                <nav style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    {navLinks.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                style={{
                                    fontSize: '0.8rem',
                                    fontWeight: '600',
                                    fontFamily: 'var(--font-sans)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    textDecoration: 'none',
                                    color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                    borderBottom: isActive ? '2px solid var(--color-primary)' : '2px solid transparent',
                                    paddingBottom: '4px',
                                    transition: 'color 250ms ease, border-color 250ms ease',
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.color = 'var(--color-text)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.color = 'var(--color-text-muted)';
                                    }
                                }}
                            >
                                {link.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </header>
    );
}
