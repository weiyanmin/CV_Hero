"use client";

import { useState, useCallback } from 'react';
import { FileText, Link2, Upload, ArrowRight, X } from 'lucide-react';
import clsx from 'clsx';
import styles from './JobDescriptionInput.module.css';

type InputMode = 'paste' | 'url' | 'pdf';

type ReadyData =
    | { type: 'text'; text: string }
    | { type: 'url'; url: string }
    | { type: 'file'; file: File };

interface JobDescriptionInputProps {
    onReady: (data: ReadyData) => void;
}

export default function JobDescriptionInput({ onReady }: JobDescriptionInputProps) {
    const [mode, setMode] = useState<InputMode>('paste');

    // Paste mode state
    const [text, setText] = useState('');

    // URL mode state
    const [url, setUrl] = useState('');
    const [urlError, setUrlError] = useState('');

    // PDF mode state
    const [file, setFile] = useState<File | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);

    const isValidUrl = (value: string): boolean => {
        try {
            new URL(value);
            return true;
        } catch {
            return false;
        }
    };

    const canContinue = (): boolean => {
        switch (mode) {
            case 'paste':
                return text.trim().length > 20;
            case 'url':
                return url.trim().length > 0 && isValidUrl(url.trim());
            case 'pdf':
                return file !== null;
        }
    };

    const handleContinue = () => {
        if (!canContinue()) return;

        switch (mode) {
            case 'paste':
                onReady({ type: 'text', text: text.trim() });
                break;
            case 'url':
                if (!isValidUrl(url.trim())) {
                    setUrlError('Please enter a valid URL');
                    return;
                }
                setUrlError('');
                onReady({ type: 'url', url: url.trim() });
                break;
            case 'pdf':
                if (file) {
                    onReady({ type: 'file', file });
                }
                break;
        }
    };

    const handleUrlChange = (value: string) => {
        setUrl(value);
        if (urlError && (value.trim() === '' || isValidUrl(value.trim()))) {
            setUrlError('');
        }
    };

    const handleUrlKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleContinue();
        }
    };

    // PDF drag & drop handlers
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const validateAndSetFile = useCallback((f: File) => {
        if (f.type !== 'application/pdf') {
            alert('Only PDF files are accepted.');
            return;
        }
        if (f.size > 5 * 1024 * 1024) {
            alert('File exceeds maximum size of 5MB.');
            return;
        }
        setFile(f);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    }, [validateAndSetFile]);

    const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            validateAndSetFile(e.target.files[0]);
        }
    }, [validateAndSetFile]);

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const tabs: { key: InputMode; label: string; icon: React.ReactNode }[] = [
        { key: 'paste', label: 'Paste Text', icon: <FileText size={16} /> },
        { key: 'url', label: 'Job URL', icon: <Link2 size={16} /> },
        { key: 'pdf', label: 'Upload PDF', icon: <Upload size={16} /> },
    ];

    return (
        <div className={styles.wrapper}>
            {/* Tab Bar */}
            <div className={styles.tabBar}>
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        className={clsx(styles.tab, mode === tab.key && styles.active)}
                        onClick={() => setMode(tab.key)}
                        type="button"
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Panels */}
            <div className={styles.panel}>
                {mode === 'paste' && (
                    <>
                        <textarea
                            className={styles.textarea}
                            rows={8}
                            placeholder="Paste the job description here..."
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                        />
                        <div className={styles.charCount}>
                            {text.length > 0 ? `${text.length} characters` : ''}
                        </div>
                    </>
                )}

                {mode === 'url' && (
                    <>
                        <div className={styles.urlRow}>
                            <input
                                type="url"
                                className={clsx(styles.urlInput, urlError && styles.error)}
                                placeholder="https://example.com/jobs/software-engineer"
                                value={url}
                                onChange={(e) => handleUrlChange(e.target.value)}
                                onKeyDown={handleUrlKeyDown}
                            />
                        </div>
                        {urlError && (
                            <p className={styles.urlError}>{urlError}</p>
                        )}
                        {!urlError && (
                            <p className={styles.urlHint}>
                                Paste a job posting URL — we&apos;ll extract the description automatically
                            </p>
                        )}
                    </>
                )}

                {mode === 'pdf' && (
                    <>
                        <div
                            className={clsx(styles.uploadZone, isDragOver && styles.dragOver)}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => document.getElementById('jd-file-input')?.click()}
                        >
                            <input
                                type="file"
                                id="jd-file-input"
                                hidden
                                accept=".pdf"
                                onChange={handleFileInputChange}
                            />
                            <div className={styles.uploadIcon}>
                                <Upload size={40} strokeWidth={1.5} />
                            </div>
                            <p className={styles.uploadText}>
                                Drop your PDF here or click to browse
                            </p>
                            <p className={styles.uploadSubtext}>
                                Job description in PDF format
                            </p>
                            <div className={styles.uploadFormats}>
                                <span>.pdf</span>
                                <span style={{ fontSize: '0.7rem', opacity: 0.7, border: 'none', background: 'transparent', padding: 0 }}>
                                    Max 5MB
                                </span>
                            </div>
                        </div>

                        {file && (
                            <div className={styles.fileInfo}>
                                <FileText size={18} className={styles.fileIcon} />
                                <span className={styles.fileName}>{file.name}</span>
                                <span className={styles.fileSize}>{formatFileSize(file.size)}</span>
                                <button
                                    className={styles.removeFile}
                                    onClick={() => setFile(null)}
                                    type="button"
                                    title="Remove file"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Continue Button */}
            <div className={styles.footer}>
                <button
                    className={clsx('btn-primary', styles.continueBtn)}
                    disabled={!canContinue()}
                    onClick={handleContinue}
                    type="button"
                >
                    Continue
                    <ArrowRight size={18} />
                </button>
            </div>
        </div>
    );
}
