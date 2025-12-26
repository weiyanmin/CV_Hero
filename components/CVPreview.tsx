"use client";

import { useRef, useState, useEffect } from 'react';
import { CVData } from '@/lib/gemini';
import styles from './CVPreview.module.css';
import { Download, Printer, FileText, Loader2, Plus, Trash2, Edit3, Link, Briefcase, Sparkles, Palette, Lock } from 'lucide-react';
import { generateDOCX } from '@/lib/generators';
import { getGoogleAuthUrl } from '@/lib/googleAuth';
import { createGoogleDoc } from '@/lib/googleDocs';

interface CVPreviewProps {
    data: CVData;
}

export default function CVPreview({ data: initialData }: CVPreviewProps) {
    const componentRef = useRef<HTMLDivElement>(null);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [accessToken, setAccessToken] = useState<string | null>(null);

    // Editable CV data state
    const [cvData, setCvData] = useState<CVData>(initialData);

    // UI state for editing
    const [editingJobTitle, setEditingJobTitle] = useState(false);
    const [newJobTitle, setNewJobTitle] = useState(initialData.jobTitle || '');

    // Links editing
    const [linkedin, setLinkedin] = useState(initialData.contactInfo.linkedin || '');
    const [website, setWebsite] = useState(initialData.contactInfo.website || '');
    const [github, setGithub] = useState('');

    // Experience editing
    const [showAddExperience, setShowAddExperience] = useState(false);
    const [newExperience, setNewExperience] = useState({
        role: '',
        company: '',
        duration: '',
        description: ['']
    });
    const [editingExperienceIndex, setEditingExperienceIndex] = useState<number | null>(null);

    // Heading color customization
    const [headingColor, setHeadingColor] = useState('#1a1a1a');
    const presetColors = [
        '#1a1a1a', // Black (default)
        '#2563eb', // Blue
        '#16a34a', // Green
        '#dc2626', // Red
        '#7c3aed', // Purple
        '#0891b2', // Teal
        '#c2410c', // Orange
        '#4f46e5', // Indigo
    ];

    // Check for OAuth token in URL hash on mount
    useEffect(() => {
        const hash = window.location.hash;
        if (hash) {
            const params = new URLSearchParams(hash.substring(1));
            const token = params.get('access_token');
            if (token) {
                setAccessToken(token);
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        }
    }, []);

    useEffect(() => {
        if (accessToken && cvData) {
            handleCreateGoogleDoc(accessToken);
        }
    }, [accessToken]);

    // Update job title
    const handleUpdateJobTitle = () => {
        setCvData(prev => ({ ...prev, jobTitle: newJobTitle }));
        setEditingJobTitle(false);
    };

    // Update links
    const handleUpdateLinks = () => {
        setCvData(prev => ({
            ...prev,
            contactInfo: {
                ...prev.contactInfo,
                linkedin: linkedin || undefined,
                website: website || undefined,
            }
        }));
    };

    // Add or Update experience
    const handleAddExperience = () => {
        if (!newExperience.role || !newExperience.company) return;

        setCvData(prev => {
            const updatedExperience = [...prev.experience];
            if (editingExperienceIndex !== null) {
                updatedExperience[editingExperienceIndex] = newExperience;
            } else {
                updatedExperience.unshift(newExperience);
            }
            return { ...prev, experience: updatedExperience };
        });

        setNewExperience({ role: '', company: '', duration: '', description: [''] });
        setEditingExperienceIndex(null);
        setShowAddExperience(false);
    };

    const handleEditExperience = (index: number) => {
        const exp = cvData.experience[index];
        setNewExperience(exp);
        setEditingExperienceIndex(index);
        setShowAddExperience(true);
    };

    // Remove experience
    const handleRemoveExperience = (index: number) => {
        setCvData(prev => ({
            ...prev,
            experience: prev.experience.filter((_, i) => i !== index)
        }));
        if (editingExperienceIndex === index) {
            setEditingExperienceIndex(null);
            setShowAddExperience(false);
            setNewExperience({ role: '', company: '', duration: '', description: [''] });
        }
    };

    const handleDownloadPDF = async () => {
        const element = document.getElementById('cv-document');
        if (!element) return;

        try {
            // Dynamically import html2pdf to avoid SSR issues
            const html2pdf = (await import('html2pdf.js')).default;

            const filename = filterFilename(cvData.fullName) + '_CV.pdf';

            const opt = {
                margin: [10, 10, 10, 10] as [number, number, number, number],
                filename: filename,
                image: { type: 'jpeg' as const, quality: 0.98 },
                html2canvas: {
                    scale: 2,
                    useCORS: true,
                    letterRendering: true,
                    windowWidth: 1200 // Force desktop width to ensure single line contact info
                },
                jsPDF: {
                    unit: 'mm' as const,
                    format: 'a4' as const,
                    orientation: 'portrait' as const
                },
                pagebreak: { mode: ['css', 'legacy'] }
            };

            const rawBlob = await html2pdf().set(opt).from(element).output('blob');
            const pdfBlob = new Blob([rawBlob], { type: 'application/pdf' });
            triggerDownload(pdfBlob, filename);
        } catch (e) {
            console.error('PDF generation error:', e);
            alert('Error generating PDF. Please try again.');
        }
    };

    const triggerDownload = (blob: Blob, filename: string) => {
        // Check if it's iOS Safari
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

        if (isIOS || isSafari) {
            // For iOS/Safari, open blob in new tab for download
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
            // Standard download for other browsers
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

    const handleDownloadDocx = async () => {
        try {
            const blob = await generateDOCX(cvData, headingColor);
            const filename = filterFilename(cvData.fullName) + '_CV.docx';
            triggerDownload(blob, filename);
        } catch (e: any) {
            console.error(e);
            alert('Error generating DOCX: ' + (e.message || 'Unknown error') + '. Please try on desktop.');
        }
    };

    const handleOpenInDocs = () => {
        sessionStorage.setItem('cv_data', JSON.stringify(cvData));
        const redirectUri = window.location.origin;
        const authUrl = getGoogleAuthUrl(redirectUri);
        window.location.href = authUrl;
    };

    const handleCreateGoogleDoc = async (token: string) => {
        setGoogleLoading(true);
        try {
            let data = cvData;
            const storedData = sessionStorage.getItem('cv_data');
            if (storedData) {
                data = JSON.parse(storedData);
                sessionStorage.removeItem('cv_data');
            }
            const docUrl = await createGoogleDoc(token, data);
            window.open(docUrl, '_blank');
        } catch (error: any) {
            console.error('Error creating Google Doc:', error);
            alert(`Failed to create Google Doc: ${error.message}`);
        } finally {
            setGoogleLoading(false);
            setAccessToken(null);
        }
    };

    // Input styles for dark theme
    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '0.625rem 0.875rem',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--color-border)',
        background: 'var(--color-surface-elevated)',
        color: 'var(--color-text)',
        fontSize: '0.9rem',
        fontFamily: 'var(--font-sans)',
        outline: 'none',
    };

    const labelStyle: React.CSSProperties = {
        display: 'block',
        fontSize: '0.75rem',
        fontWeight: '600',
        color: 'var(--color-text-muted)',
        marginBottom: '0.375rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
    };

    return (
        <div className={styles.previewContainer}>
            {/* The Printable Document */}
            <div id="cv-document" className={styles.document} ref={componentRef}>
                <div className={styles.header}>
                    <div className={styles.name} style={{ color: headingColor }}>{cvData.fullName}</div>
                    {cvData.jobTitle && <div className={styles.jobTitle}>{cvData.jobTitle}</div>}
                    <div className={styles.contact}>
                        {cvData.contactInfo.email && <span>{cvData.contactInfo.email}</span>}
                        {cvData.contactInfo.phone && <span> | {cvData.contactInfo.phone}</span>}
                        {cvData.contactInfo.location && <span> | {cvData.contactInfo.location}</span>}
                        {linkedin && (
                            <span> | <a href={linkedin.startsWith('http') ? linkedin : `https://${linkedin}`} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>LinkedIn</a></span>
                        )}
                        {website && (
                            <span> | <a href={website.startsWith('http') ? website : `https://${website}`} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>Website</a></span>
                        )}
                        {github && (
                            <span> | <a href={github.startsWith('http') ? github : `https://${github}`} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>GitHub</a></span>
                        )}
                    </div>
                </div>

                <section className={styles.section}>
                    <div className={styles.sectionTitle} style={{ color: headingColor, borderBottomColor: headingColor }}>Professional Summary</div>
                    <p>{cvData.summary}</p>
                </section>

                <section className={styles.section}>
                    <div className={styles.sectionTitle} style={{ color: headingColor, borderBottomColor: headingColor }}>Work Experience</div>
                    {cvData.experience.map((job, i) => (
                        <div key={i} className={styles.entry}>
                            <div className={styles.entryHeader}>
                                <span className={styles.role}>{job.role}</span>
                                <span className={styles.date}>{job.duration}</span>
                            </div>
                            <div className={styles.company}>{job.company}</div>
                            <ul className={styles.list}>
                                {job.description.map((desc, j) => (
                                    <li key={j}>{desc}</li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </section>

                <section className={styles.section}>
                    <div className={styles.sectionTitle} style={{ color: headingColor, borderBottomColor: headingColor }}>Education</div>
                    {cvData.education.map((edu, i) => (
                        <div key={i} className={styles.entry}>
                            <div className={styles.entryHeader}>
                                <span className={styles.role}>{edu.institution}</span>
                                <span className={styles.date}>{edu.year}</span>
                            </div>
                            <div>{edu.degree}</div>
                        </div>
                    ))}
                </section>

                {cvData.certifications && cvData.certifications.length > 0 && (
                    <section className={styles.section}>
                        <div className={styles.sectionTitle} style={{ color: headingColor, borderBottomColor: headingColor }}>Certifications</div>
                        {cvData.certifications.map((cert, i) => (
                            <div key={i} className={styles.entry}>
                                <div className={styles.entryHeader}>
                                    <span className={styles.role}>{cert.name}</span>
                                    {cert.year && <span className={styles.date}>{cert.year}</span>}
                                </div>
                                {cert.issuer && <div className={styles.company}>{cert.issuer}</div>}
                            </div>
                        ))}
                    </section>
                )}

                <section className={styles.section}>
                    <div className={styles.sectionTitle} style={{ color: headingColor, borderBottomColor: headingColor }}>Skills</div>
                    <p>{cvData.skills.slice(0, 6).join(' • ')}</p>
                </section>

                {cvData.projects && cvData.projects.length > 0 && (
                    <section className={styles.section}>
                        <div className={styles.sectionTitle} style={{ color: headingColor, borderBottomColor: headingColor }}>Projects</div>
                        {cvData.projects.map((proj, i) => (
                            <div key={i} className={styles.entry}>
                                <div className={styles.entryHeader}>
                                    <span className={styles.role}>{proj.name}</span>
                                </div>
                                {proj.link && <div className={styles.company}>{proj.link}</div>}
                                <p>{proj.description}</p>
                            </div>
                        ))}
                    </section>
                )}

                {cvData.volunteering && cvData.volunteering.length > 0 && (
                    <section className={styles.section}>
                        <div className={styles.sectionTitle} style={{ color: headingColor, borderBottomColor: headingColor }}>Volunteering</div>
                        {cvData.volunteering.map((vol, i) => (
                            <div key={i} className={styles.entry}>
                                <div className={styles.entryHeader}>
                                    <span className={styles.role}>{vol.role}</span>
                                    {vol.duration && <span className={styles.date}>{vol.duration}</span>}
                                </div>
                                <div className={styles.company}>{vol.organization}</div>
                                {vol.description && <p>{vol.description}</p>}
                            </div>
                        ))}
                    </section>
                )}
            </div>

            {/* Sidebar */}
            <div className={styles.actions}>
                {/* Export Options */}
                <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
                    <h3 style={{ marginBottom: '1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Download size={16} /> Export Options
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        <button onClick={handleDownloadDocx} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                            <Download size={18} /> Download DOCX
                        </button>
                        <button onClick={handleDownloadPDF} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                            <Printer size={18} /> Save as PDF
                        </button>
                        <button
                            disabled
                            className="btn-secondary"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                justifyContent: 'center',
                                position: 'relative',
                                cursor: 'not-allowed',
                                opacity: 0.6
                            }}
                        >
                            <Lock size={16} />
                            <span style={{ filter: 'blur(0.5px)' }}>Google Docs (Soon)</span>
                        </button>
                    </div>
                </div>

                {/* Optimize CV Section */}
                <div className="card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1.25rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)' }}>
                        <Sparkles size={16} /> Optimize CV
                    </h3>

                    {/* Heading Color */}
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={labelStyle}>
                            <Palette size={12} style={{ display: 'inline', marginRight: '4px' }} />
                            Heading Color
                        </label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            {presetColors.map((color) => (
                                <button
                                    key={color}
                                    onClick={() => setHeadingColor(color)}
                                    style={{
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '50%',
                                        background: color,
                                        border: headingColor === color ? '3px solid var(--color-primary)' : '2px solid var(--color-border)',
                                        cursor: 'pointer',
                                        transition: 'transform 0.15s ease',
                                        transform: headingColor === color ? 'scale(1.1)' : 'scale(1)',
                                    }}
                                    title={color}
                                />
                            ))}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                                type="color"
                                value={headingColor}
                                onChange={(e) => setHeadingColor(e.target.value)}
                                style={{
                                    width: '40px',
                                    height: '32px',
                                    padding: 0,
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius-sm)',
                                    cursor: 'pointer',
                                    background: 'transparent',
                                }}
                                title="Custom color"
                            />
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                                {headingColor.toUpperCase()}
                            </span>
                        </div>
                    </div>

                    {/* Change Job Title */}
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={labelStyle}>
                            <Edit3 size={12} style={{ display: 'inline', marginRight: '4px' }} />
                            Job Title
                        </label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <input
                                type="text"
                                value={newJobTitle}
                                onChange={(e) => setNewJobTitle(e.target.value)}
                                placeholder="e.g. Senior Software Engineer"
                                style={inputStyle}
                            />
                            <button
                                onClick={handleUpdateJobTitle}
                                className="btn-primary"
                                style={{ width: '100%', padding: '0.65rem', fontSize: '0.85rem' }}
                            >
                                Update Title
                            </button>
                        </div>
                    </div>

                    {/* Add LinkedIn/Website/GitHub */}
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={labelStyle}>
                            <Link size={12} style={{ display: 'inline', marginRight: '4px' }} />
                            Profile Links
                        </label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <input
                                type="text"
                                value={linkedin}
                                onChange={(e) => setLinkedin(e.target.value)}
                                placeholder="LinkedIn URL"
                                style={inputStyle}
                            />
                            <input
                                type="text"
                                value={website}
                                onChange={(e) => setWebsite(e.target.value)}
                                placeholder="Website or Portfolio URL"
                                style={inputStyle}
                            />
                            <input
                                type="text"
                                value={github}
                                onChange={(e) => setGithub(e.target.value)}
                                placeholder="GitHub URL"
                                style={inputStyle}
                            />
                            <button
                                onClick={handleUpdateLinks}
                                className="btn-primary"
                                style={{ width: '100%', padding: '0.65rem', fontSize: '0.85rem' }}
                            >
                                Update Links
                            </button>
                        </div>
                    </div>

                    {/* Add/Remove Work Experience */}
                    <div>
                        <label style={labelStyle}>
                            <Briefcase size={12} style={{ display: 'inline', marginRight: '4px' }} />
                            Work Experience
                        </label>

                        {/* Existing experiences with remove button */}
                        <div style={{ marginBottom: '0.75rem', maxHeight: '200px', overflowY: 'auto' }}>
                            {cvData.experience.map((exp, i) => (
                                <div
                                    key={i}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '0.5rem 0.75rem',
                                        background: 'var(--color-surface-elevated)',
                                        borderRadius: 'var(--radius-sm)',
                                        marginBottom: '0.5rem',
                                        border: '1px solid var(--color-border)',
                                    }}
                                >
                                    <div style={{ flex: 1, minWidth: 0, paddingRight: '0.75rem' }}>
                                        <div style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--color-text)', lineHeight: '1.4' }}>
                                            {exp.role}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
                                            {exp.company}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                                        <button
                                            onClick={() => handleEditExperience(i)}
                                            style={{
                                                background: 'var(--color-bg)',
                                                border: '1px solid var(--color-border)',
                                                color: 'var(--color-primary)',
                                                cursor: 'pointer',
                                                padding: '0.5rem',
                                                borderRadius: 'var(--radius-sm)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                            title="Edit"
                                        >
                                            <Edit3 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleRemoveExperience(i)}
                                            style={{
                                                background: 'var(--color-bg)',
                                                border: '1px solid var(--color-border)',
                                                color: 'var(--color-error)',
                                                cursor: 'pointer',
                                                padding: '0.5rem',
                                                borderRadius: 'var(--radius-sm)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                            title="Remove"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Add new experience form */}
                        {showAddExperience ? (
                            <div style={{
                                padding: '1rem',
                                background: 'var(--color-surface-elevated)',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--color-border)',
                            }}>
                                <div style={{ marginBottom: '0.75rem' }}>
                                    <input
                                        type="text"
                                        value={newExperience.role}
                                        onChange={(e) => setNewExperience(prev => ({ ...prev, role: e.target.value }))}
                                        placeholder="Job Title"
                                        style={inputStyle}
                                    />
                                </div>
                                <div style={{ marginBottom: '0.75rem' }}>
                                    <input
                                        type="text"
                                        value={newExperience.company}
                                        onChange={(e) => setNewExperience(prev => ({ ...prev, company: e.target.value }))}
                                        placeholder="Company Name"
                                        style={inputStyle}
                                    />
                                </div>
                                <div style={{ marginBottom: '0.75rem' }}>
                                    <input
                                        type="text"
                                        value={newExperience.duration}
                                        onChange={(e) => setNewExperience(prev => ({ ...prev, duration: e.target.value }))}
                                        placeholder="Duration (e.g. Jan 2020 - Present)"
                                        style={inputStyle}
                                    />
                                </div>
                                <div style={{ marginBottom: '0.75rem' }}>
                                    <textarea
                                        value={newExperience.description[0]}
                                        onChange={(e) => setNewExperience(prev => ({ ...prev, description: [e.target.value] }))}
                                        placeholder="Key responsibilities (one per line)"
                                        rows={3}
                                        style={{ ...inputStyle, resize: 'vertical' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <button onClick={handleAddExperience} className="btn-primary" style={{ width: '100%', fontSize: '0.85rem', padding: '0.65rem' }}>
                                        {editingExperienceIndex !== null ? 'Update Experience' : 'Add Experience'}
                                    </button>
                                    <button onClick={() => {
                                        setShowAddExperience(false);
                                        setEditingExperienceIndex(null);
                                        setNewExperience({ role: '', company: '', duration: '', description: [''] });
                                    }} className="btn-secondary" style={{ width: '100%', fontSize: '0.85rem', padding: '0.65rem' }}>
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowAddExperience(true)}
                                className="btn-secondary"
                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}
                            >
                                <Plus size={16} /> Add Experience
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <style jsx global>{`
        @media print {
          @page {
            margin: 0.5in;
            size: A4;
          }
          
          html, body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          body * {
            visibility: hidden;
          }
          
          #cv-document, #cv-document * {
            visibility: visible;
          }
          
          #cv-document {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0.5in;
            box-shadow: none;
            background: white !important;
            color: black !important;
          }
        }
        
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}

function filterFilename(name: string) {
    return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}
