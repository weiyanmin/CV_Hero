"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, FileText, Bot, Loader2, Sparkles, ArrowLeft } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import JobDescriptionInput from '@/components/JobDescriptionInput';
import FileUpload from '@/components/FileUpload';
import CoverLetterPreview, { CoverLetterData } from '@/components/CoverLetterPreview';
import Turnstile from '@/components/Turnstile';
import clsx from 'clsx';
import styles from './page.module.css';

type JDData =
    | { type: 'text'; text: string }
    | { type: 'url'; url: string }
    | { type: 'file'; file: File };

export default function CoverLetterPage() {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    
    // Step 1 State
    const [jdData, setJdData] = useState<JDData | null>(null);
    
    // Step 2 State
    const [cvFile, setCvFile] = useState<File | null>(null);
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
    
    // Step 3 State
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [coverLetterData, setCoverLetterData] = useState<CoverLetterData | null>(null);

    const handleJDReady = (data: JDData) => {
        setJdData(data);
        setStep(2);
    };

    const handleGenerate = async () => {
        if (!cvFile || !jdData || !turnstileToken) return;

        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('cvFile', cvFile);
        formData.append('turnstileToken', turnstileToken);

        if (jdData.type === 'text') {
            formData.append('jobDescriptionText', jdData.text);
        } else if (jdData.type === 'url') {
            formData.append('jobDescriptionUrl', jdData.url);
        } else if (jdData.type === 'file') {
            formData.append('jobDescriptionFile', jdData.file);
        }

        try {
            const res = await fetch('/api/generate-cover-letter', {
                method: 'POST',
                body: formData,
            });

            const json = await res.json();
            if (!res.ok) {
                throw new Error(json.error || 'Failed to generate cover letter');
            }

            setCoverLetterData(json.data);
            setStep(3);
        } catch (err: any) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleStartOver = () => {
        setStep(1);
        setJdData(null);
        setCvFile(null);
        setTurnstileToken(null);
        setCoverLetterData(null);
        setError(null);
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Header />

            <main className="container" style={{ marginTop: '120px', flex: 1, paddingBottom: '3rem' }}>
                {step !== 3 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className={styles.pageWrapper}
                    >
                        <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
                            <h1 style={{
                                fontSize: '2.5rem',
                                fontWeight: '700',
                                letterSpacing: '-0.03em',
                                lineHeight: '1.2',
                                marginBottom: '1rem',
                                color: 'var(--color-text)'
                            }}>
                                Custom Cover Letters
                                <br />
                                <span style={{ color: 'var(--color-primary)' }}>Tailored to the Job</span>
                            </h1>
                            <p style={{
                                fontSize: '1rem',
                                color: 'var(--color-text-muted)',
                                lineHeight: '1.6',
                                maxWidth: '500px',
                                margin: '0 auto',
                                fontFamily: 'var(--font-mono)'
                            }}>
                                Upload your CV and a job description. We'll generate a perfectly targeted cover letter that highlights your most relevant experience.
                            </p>
                        </div>

                        {/* Stepper */}
                        <div className={styles.stepIndicator}>
                            <div className={styles.step}>
                                <div className={styles.stepDotWrapper}>
                                    <div className={clsx(styles.stepDot, step >= 1 && styles.active, step > 1 && styles.completed)}>
                                        <Briefcase size={16} />
                                    </div>
                                    <span className={clsx(styles.stepLabel, step >= 1 && styles.active, step > 1 && styles.completed)}>
                                        Job Details
                                    </span>
                                </div>
                                <div className={clsx(styles.stepLine, step > 1 && styles.completed)}></div>
                            </div>

                            <div className={styles.step}>
                                <div className={styles.stepDotWrapper}>
                                    <div className={clsx(styles.stepDot, step >= 2 && styles.active, step > 2 && styles.completed)}>
                                        <FileText size={16} />
                                    </div>
                                    <span className={clsx(styles.stepLabel, step >= 2 && styles.active, step > 2 && styles.completed)}>
                                        Your CV
                                    </span>
                                </div>
                                <div className={clsx(styles.stepLine, step > 2 && styles.completed)}></div>
                            </div>

                            <div className={styles.step}>
                                <div className={styles.stepDotWrapper}>
                                    <div className={clsx(styles.stepDot, step >= 3 && styles.active)}>
                                        <Bot size={16} />
                                    </div>
                                    <span className={clsx(styles.stepLabel, step >= 3 && styles.active)}>
                                        Generate
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Step Content */}
                        <div className="card card-responsive">
                            <AnimatePresence mode="wait">
                                {step === 1 && (
                                    <motion.div
                                        key="step1"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                    >
                                        <h2 className={styles.sectionTitle}>
                                            <Briefcase size={20} style={{ color: 'var(--color-primary)' }} />
                                            Provide the Job Description
                                        </h2>
                                        <p className={styles.sectionSubtitle}>
                                            Paste the text, provide a URL, or upload a PDF of the job you want to apply for.
                                        </p>
                                        <JobDescriptionInput onReady={handleJDReady} />
                                    </motion.div>
                                )}

                                {step === 2 && (
                                    <motion.div
                                        key="step2"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                    >
                                        <button onClick={() => setStep(1)} className={styles.backButton}>
                                            <ArrowLeft size={16} /> Back to Job Description
                                        </button>

                                        <h2 className={styles.sectionTitle}>
                                            <FileText size={20} style={{ color: 'var(--color-primary)' }} />
                                            Upload Your CV
                                        </h2>
                                        <p className={styles.sectionSubtitle}>
                                            We'll use your actual experience to craft the cover letter.
                                        </p>
                                        
                                        <FileUpload onFileSelect={(f) => { setCvFile(f); setError(null); }} />

                                        {cvFile && (
                                            <div style={{ marginTop: '2rem', borderTop: '1px solid var(--color-border)', paddingTop: '2rem' }}>
                                                {!loading ? (
                                                    <>
                                                        <Turnstile
                                                            onVerify={(token) => setTurnstileToken(token)}
                                                            onError={() => setError('Security verification failed. Please refresh.')}
                                                        />

                                                        <button
                                                            className={clsx('btn-primary', styles.generateBtn)}
                                                            onClick={handleGenerate}
                                                            disabled={!turnstileToken}
                                                        >
                                                            <Sparkles size={18} />
                                                            Generate Cover Letter
                                                        </button>
                                                    </>
                                                ) : (
                                                    <div className={styles.loadingContainer}>
                                                        <Loader2 size={40} className={styles.loadingSpinner} />
                                                        <div>
                                                            <div className={styles.loadingText}>Writing Cover Letter...</div>
                                                            <div className={styles.loadingSubtext}>Matching your skills to the job requirements</div>
                                                        </div>
                                                    </div>
                                                )}

                                                {error && (
                                                    <div className={styles.errorBox}>
                                                        {error}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <CoverLetterPreview 
                            data={coverLetterData!} 
                            onStartOver={handleStartOver} 
                        />
                    </motion.div>
                )}
            </main>

            <Footer />
        </div>
    );
}
