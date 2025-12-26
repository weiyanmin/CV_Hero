"use client";

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FileUpload from '@/components/FileUpload';
import CVPreview from '@/components/CVPreview';
import Turnstile from '@/components/Turnstile';
import { CVData } from '@/lib/gemini';
import { Loader2, Sparkles, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [cvData, setCvData] = useState<CVData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Processing...');
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const handleOptimization = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setLoadingText("Scanning Document...");

    const steps = [
      "Scanning Document...",
      "Analyzing Content...",
      "Identifying Keywords...",
      "Optimizing Structure...",
      "Polishing Language...",
      "Finalizing CV..."
    ];
    let stepIndex = 0;

    const intervalId = setInterval(() => {
      stepIndex = (stepIndex + 1) % steps.length;
      setLoadingText(steps[stepIndex]);
    }, 3000);

    const formData = new FormData();
    formData.append('file', file);
    if (turnstileToken) {
      formData.append('turnstileToken', turnstileToken);
    }

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to generate CV');
      }

      setCvData(json.data);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      clearInterval(intervalId);
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <main className="container" style={{ marginTop: '120px', flex: 1, paddingBottom: '2rem' }}>
        {!cvData ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{ maxWidth: '700px', width: '100%', margin: '0 auto' }}
          >
            <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
              <h1 style={{
                fontSize: '3rem',
                fontWeight: '700',
                letterSpacing: '-0.03em',
                lineHeight: '1.1',
                marginBottom: '1.25rem',
                color: 'var(--color-text)'
              }}>
                Transform Your CV
                <br />
                <span style={{ color: 'var(--color-primary)' }}>Into an ATS Magnet</span>
              </h1>
              <p style={{
                fontSize: '1.1rem',
                color: 'var(--color-text-muted)',
                lineHeight: '1.7',
                maxWidth: '520px',
                margin: '0 auto',
                fontFamily: 'var(--font-mono)'
              }}>
                Upload your resume. Our AI rewrites it to be perfectly optimized for Applicant Tracking Systems.
              </p>
            </div>

            <div className="card card-responsive" style={{ overflow: 'hidden', maxWidth: '100%' }}>
              <FileUpload onFileSelect={(f) => { setFile(f); setError(null); }} />

              {file && (
                <div style={{ marginTop: '2rem', borderTop: '1px solid var(--color-border)', paddingTop: '2rem', width: '100%', minWidth: 0 }}>
                  <div style={{
                    marginBottom: '1.25rem',
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 1fr)',
                    justifyItems: 'center',
                    gap: '8px',
                    width: '100%',
                    overflow: 'hidden'
                  }}>
                    <span style={{
                      color: 'var(--color-primary)',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      Selected
                    </span>
                    <span style={{
                      display: 'block',
                      color: 'var(--color-text)',
                      width: '100%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      textAlign: 'center',
                      fontSize: '0.85rem',
                      fontFamily: 'var(--font-mono)',
                      padding: '0 0.5rem'
                    }}>{file.name}</span>
                  </div>

                  <Turnstile
                    onVerify={(token) => setTurnstileToken(token)}
                    onError={() => setError('Security verification failed. Please refresh.')}
                  />

                  <button
                    className="btn-primary"
                    onClick={handleOptimization}
                    disabled={loading || !turnstileToken}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        {loadingText}
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} />
                        Optimize My CV
                      </>
                    )}
                  </button>

                  {error && (
                    <div style={{
                      marginTop: '1.25rem',
                      color: 'var(--color-error)',
                      background: 'rgba(239, 68, 68, 0.1)',
                      padding: '1rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.9rem',
                      textAlign: 'center',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      {error}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Features */}
            <div style={{
              marginTop: '2rem',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '1rem',
              textAlign: 'center'
            }}>
              {[
                { label: 'AI-Powered', desc: 'Gemini 2.5 Flash' },
                { label: 'ATS Optimized', desc: 'Beat the bots' },
                { label: 'Instant Export', desc: 'DOCX, PDF, Docs' }
              ].map((feature, i) => (
                <div key={i} style={{ padding: '1.25rem', minWidth: '140px' }}>
                  <div style={{
                    color: 'var(--color-primary)',
                    fontWeight: '600',
                    fontSize: '0.85rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    marginBottom: '0.25rem'
                  }}>
                    {feature.label}
                  </div>
                  <div style={{
                    color: 'var(--color-text-muted)',
                    fontSize: '0.85rem',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {feature.desc}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <button
              onClick={() => setCvData(null)}
              className="btn-secondary"
              style={{ marginBottom: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <ArrowLeft size={16} />
              Upload New File
            </button>
            <CVPreview data={cvData} />
          </motion.div>
        )}
      </main>
      <Footer />
    </div>
  );
}
