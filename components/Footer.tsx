import { Heart } from 'lucide-react';

export default function Footer() {
    return (
        <footer style={{
            borderTop: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            padding: '1.5rem 0',
            marginTop: 'auto',
        }}>
            <div className="container" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                fontSize: '0.85rem',
                color: 'var(--color-text-muted)',
                flexWrap: 'wrap',
                textAlign: 'center',
            }}>
                <span>CV Hero © All Rights Reserved</span>
                <span style={{ color: 'var(--color-border)' }}>|</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    Made with <Heart size={14} fill="var(--color-error)" color="var(--color-error)" /> by{' '}
                    <a
                        href="https://www.linkedin.com/in/weiyanmin/"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            color: 'var(--color-primary)',
                            textDecoration: 'none',
                            fontWeight: '500',
                        }}
                    >
                        Wei Yan Min
                    </a>
                </span>
            </div>
        </footer>
    );
}
