"use client";

import { useState } from 'react';
import { Download, Printer, Copy, Check, RotateCcw } from 'lucide-react';
import styles from './CoverLetterPreview.module.css';

export interface CoverLetterData {
    applicantName: string;
    companyName: string;
    jobTitle: string;
    date: string;
    greeting: string;
    paragraphs: string[];
    closing: string;
}

interface CoverLetterPreviewProps {
    data: CoverLetterData;
    onStartOver: () => void;
}

export default function CoverLetterPreview({ data, onStartOver }: CoverLetterPreviewProps) {
    const [copied, setCopied] = useState(false);

    // === Download Helpers ===

    const triggerDownload = (blob: Blob, filename: string) => {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

        if (isIOS || isSafari) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64data = reader.result as string;
                const link = document.createElement('a');
                link.href = base64data;
                link.download = filename;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                setTimeout(() => {
                    document.body.removeChild(link);
                }, 100);
            };
            reader.readAsDataURL(blob);
        } else {
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }, 100);
        }
    };

    // === DOCX Download ===

    const handleDownloadDocx = async () => {
        try {
            const { Document, Packer, Paragraph, TextRun, AlignmentType } = await import('docx');

            const children: typeof Paragraph extends new (...args: infer P) => infer R ? R[] : never = [];

            // Date
            children.push(
                new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [new TextRun({ text: data.date, size: 22 })],
                    spacing: { after: 300 },
                })
            );

            // Company name
            children.push(
                new Paragraph({
                    children: [new TextRun({ text: data.companyName, bold: true, size: 22 })],
                    spacing: { after: 100 },
                })
            );

            // Job title
            if (data.jobTitle) {
                children.push(
                    new Paragraph({
                        children: [new TextRun({ text: `Re: ${data.jobTitle}`, italics: true, size: 22 })],
                        spacing: { after: 300 },
                    })
                );
            }

            // Greeting
            children.push(
                new Paragraph({
                    children: [new TextRun({ text: data.greeting, size: 22 })],
                    spacing: { after: 200 },
                })
            );

            // Body paragraphs
            data.paragraphs.forEach((para) => {
                children.push(
                    new Paragraph({
                        children: [new TextRun({ text: para, size: 22 })],
                        spacing: { after: 200 },
                    })
                );
            });

            // Closing
            children.push(
                new Paragraph({
                    children: [new TextRun({ text: data.closing, size: 22 })],
                    spacing: { after: 400 },
                })
            );

            // Signature
            children.push(
                new Paragraph({
                    children: [new TextRun({ text: data.applicantName, bold: true, size: 22 })],
                })
            );

            const doc = new Document({
                sections: [
                    {
                        properties: {
                            page: {
                                margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
                            },
                        },
                        children,
                    },
                ],
            });

            const blob = await Packer.toBlob(doc);
            const filename = filterFilename(data.applicantName) + '_Cover_Letter.docx';
            triggerDownload(blob, filename);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : 'Unknown error';
            console.error('DOCX generation error:', e);
            alert('Error generating DOCX: ' + message);
        }
    };

    // === PDF Download ===

    const handleDownloadPDF = async () => {
        const element = document.getElementById('cover-letter-document');
        if (!element) return;

        try {
            const html2pdf = (await import('html2pdf.js')).default;

            const filename = filterFilename(data.applicantName) + '_Cover_Letter.pdf';

            const opt = {
                margin: [15, 15, 15, 15] as [number, number, number, number],
                filename,
                image: { type: 'jpeg' as const, quality: 0.98 },
                html2canvas: {
                    scale: 2,
                    useCORS: true,
                    letterRendering: true,
                    windowWidth: 1200,
                },
                jsPDF: {
                    unit: 'mm' as const,
                    format: 'a4' as const,
                    orientation: 'portrait' as const,
                },
                pagebreak: { mode: ['css', 'legacy'] },
            };

            const rawBlob = await html2pdf().set(opt).from(element).output('blob');
            const pdfBlob = new Blob([rawBlob], { type: 'application/pdf' });
            triggerDownload(pdfBlob, filename);
        } catch (e) {
            console.error('PDF generation error:', e);
            alert('Error generating PDF. Please try again.');
        }
    };

    // === Copy Text ===

    const handleCopyText = async () => {
        const plainText = [
            data.date,
            '',
            data.companyName,
            data.jobTitle ? `Re: ${data.jobTitle}` : '',
            '',
            data.greeting,
            '',
            ...data.paragraphs.map((p) => p + '\n'),
            data.closing,
            '',
            data.applicantName,
        ]
            .filter((line) => line !== undefined)
            .join('\n');

        try {
            await navigator.clipboard.writeText(plainText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = plainText;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className={styles.previewContainer}>
            {/* The Letter Document */}
            <div id="cover-letter-document" className={styles.document}>
                <div className={styles.date}>{data.date}</div>

                <div className={styles.recipientBlock}>
                    <div className={styles.companyName}>{data.companyName}</div>
                    {data.jobTitle && (
                        <div className={styles.jobTitleLine}>Re: {data.jobTitle}</div>
                    )}
                </div>

                <div className={styles.greeting}>{data.greeting}</div>

                {data.paragraphs.map((para, i) => (
                    <p key={i} className={styles.bodyParagraph}>
                        {para}
                    </p>
                ))}

                <div className={styles.closing}>{data.closing}</div>

                <div className={styles.signatureName}>{data.applicantName}</div>
            </div>

            {/* Sidebar */}
            <div className={styles.actions}>
                {/* Export Options */}
                <div className={styles.actionsCard}>
                    <h3 className={styles.actionsTitle}>
                        <Download size={16} /> Export Options
                    </h3>
                    <div className={styles.actionsButtons}>
                        <button onClick={handleDownloadDocx} className="btn-primary">
                            <Download size={18} /> Download DOCX
                        </button>
                        <button onClick={handleDownloadPDF} className="btn-secondary">
                            <Printer size={18} /> Save as PDF
                        </button>
                        <button
                            onClick={handleCopyText}
                            className="btn-secondary"
                        >
                            {copied ? <Check size={18} /> : <Copy size={18} />}
                            {copied ? 'Copied!' : 'Copy Text'}
                        </button>
                    </div>
                    {copied && (
                        <p className={styles.copiedFeedback}>
                            ✓ Copied to clipboard
                        </p>
                    )}
                </div>

                {/* Start Over */}
                <div className={styles.startOver}>
                    <button onClick={onStartOver} className="btn-secondary">
                        <RotateCcw size={18} /> Start Over
                    </button>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    @page {
                        margin: 0.75in;
                        size: A4;
                    }

                    html, body {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }

                    body * {
                        visibility: hidden;
                    }

                    #cover-letter-document,
                    #cover-letter-document * {
                        visibility: visible;
                    }

                    #cover-letter-document {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        margin: 0;
                        padding: 0.75in;
                        box-shadow: none;
                        background: white !important;
                        color: black !important;
                    }
                }
            `}</style>
        </div>
    );
}

function filterFilename(name: string) {
    return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}
