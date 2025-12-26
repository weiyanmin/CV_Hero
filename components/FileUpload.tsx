"use client";

import { useState, useCallback } from 'react';
import { UploadCloud } from 'lucide-react';
import clsx from 'clsx';
import styles from './FileUpload.module.css';

interface FileUploadProps {
    onFileSelect: (file: File) => void;
}

export default function FileUpload({ onFileSelect }: FileUploadProps) {
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const validateAndUpload = useCallback((file: File) => {
        if (file.size > 5 * 1024 * 1024) {
            alert("File exceeds maximum size of 5MB");
            return;
        }
        onFileSelect(file);
    }, [onFileSelect]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndUpload(e.dataTransfer.files[0]);
        }
    }, [validateAndUpload]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            validateAndUpload(e.target.files[0]);
        }
    }, [validateAndUpload]);

    return (
        <div
            className={clsx(styles.uploadZone, isDragOver && styles.dragOver)}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input')?.click()}
        >
            <input
                type="file"
                id="file-input"
                hidden
                accept=".pdf,.docx"
                onChange={handleChange}
            />
            <div className={styles.icon}>
                <UploadCloud size={56} strokeWidth={1.5} />
            </div>
            <p className={styles.text}>
                <span className={styles.desktopText}>Drop your CV here or click to browse</span>
                <span className={styles.mobileText}>Drop your CV here</span>
            </p>
            <p className={styles.subtext}>AI-powered optimization in seconds</p>
            <div className={styles.formats}>
                <span>.pdf</span>
                <span>.docx</span>
                <span style={{ fontSize: '0.75rem', opacity: 0.7, border: 'none', background: 'transparent', padding: 0 }}>Max 5MB</span>
            </div>
        </div>
    );
}
