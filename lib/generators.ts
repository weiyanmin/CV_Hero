import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, TabStopPosition, TabStopType } from "docx";
import { CVData, CoverLetterData } from "./gemini";

export const generateDOCX = async (data: CVData, headingColor: string = "#000000"): Promise<Blob> => {
    // Strip # from hex color for docx
    const colorHex = headingColor.replace('#', '');

    const doc = new Document({
        sections: [
            {
                properties: {
                    page: {
                        margin: {
                            top: 720, // 0.5 inch
                            right: 720,
                            bottom: 720,
                            left: 720,
                        },
                    },
                },
                children: [
                    // Header
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: data.fullName,
                                bold: true,
                                size: 32,
                                color: colorHex
                            })
                        ],
                        heading: HeadingLevel.HEADING_1,
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 100 },
                    }),
                    // Job Title
                    ...(data.jobTitle ? [new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({ text: data.jobTitle, italics: true, size: 24 }),
                        ],
                        spacing: { after: 100 },
                    })] : []),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({ text: [data.contactInfo.email, data.contactInfo.phone, data.contactInfo.location, data.contactInfo.linkedin].filter(Boolean).join(" | "), size: 20 }),
                        ],
                        spacing: { after: 400 },
                    }),

                    // Summary
                    createSectionHeading("Professional Summary", colorHex),
                    new Paragraph({
                        children: [new TextRun({ text: data.summary, size: 22 })],
                        spacing: { after: 300 },
                    }),

                    // Experience
                    createSectionHeading("Work Experience", colorHex),
                    ...(data.experience || []).flatMap((job) => [
                        new Paragraph({
                            children: [
                                new TextRun({ text: job.role || "Role", bold: true, size: 24 }),
                                new TextRun({
                                    text: `\t${job.duration || ""}`,
                                    bold: true,
                                    size: 24,
                                }),
                            ],
                            tabStops: [
                                {
                                    type: TabStopType.RIGHT,
                                    position: 9000,
                                },
                            ],
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: job.company || "Company",
                                    italics: true,
                                })
                            ],
                            spacing: { after: 100 },
                        }),
                        ...(job.description || []).map(desc =>
                            new Paragraph({
                                text: `• ${desc}`,
                                indent: { left: 360 }, // Bullet indent
                            })
                        ),
                        new Paragraph({ text: "", spacing: { after: 200 } }), // Spacer
                    ]),

                    // Education
                    createSectionHeading("Education", colorHex),
                    ...(data.education || []).map((edu) =>
                        new Paragraph({
                            children: [
                                new TextRun({ text: edu.institution || "Institution", bold: true }),
                                new TextRun({ text: ` - ${edu.degree || "Degree"}`, italics: true }),
                                new TextRun({ text: `\t${edu.year || ""}` }),
                            ],
                            tabStops: [
                                { type: TabStopType.RIGHT, position: 9000 }
                            ]
                        })
                    ),

                    // Certifications (if any)
                    ...(data.certifications && data.certifications.length > 0 ? [
                        createSectionHeading("Certifications", colorHex),
                        ...data.certifications.map((cert) =>
                            new Paragraph({
                                children: [
                                    new TextRun({ text: cert.name, bold: true }),
                                    ...(cert.issuer ? [new TextRun({ text: ` - ${cert.issuer}`, italics: true })] : []),
                                    ...(cert.year ? [new TextRun({ text: `\t${cert.year}` })] : []),
                                ],
                                tabStops: [
                                    { type: TabStopType.RIGHT, position: 9000 }
                                ]
                            })
                        ),
                    ] : []),

                    // Volunteering (if any)
                    ...(data.volunteering && data.volunteering.length > 0 ? [
                        createSectionHeading("Volunteering", colorHex),
                        ...data.volunteering.map((vol) =>
                            new Paragraph({
                                children: [
                                    new TextRun({ text: vol.role, bold: true }),
                                    new TextRun({ text: ` - ${vol.organization}`, italics: true }),
                                    ...(vol.duration ? [new TextRun({ text: `\t${vol.duration}` })] : []),
                                ],
                                tabStops: [
                                    { type: TabStopType.RIGHT, position: 9000 }
                                ]
                            })
                        ),
                    ] : []),

                    // Skills
                    createSectionHeading("Skills", colorHex),
                    new Paragraph({
                        children: [new TextRun({ text: (data.skills || []).slice(0, 15).join(" • ") || "SKills" })],
                    }),
                ],
            },
        ],
    });

    return await Packer.toBlob(doc);
};

function createSectionHeading(text: string, colorHex: string): Paragraph {
    return new Paragraph({
        children: [
            new TextRun({
                text: text.toUpperCase(),
                color: colorHex,
                bold: true
            })
        ],
        heading: HeadingLevel.HEADING_2,
        border: {
            bottom: {
                color: colorHex,
                space: 1,
                style: "single",
                size: 6,
            },
        },
        spacing: { before: 200, after: 200 },
    });
}

export const generateCoverLetterDOCX = async (data: CoverLetterData): Promise<Blob> => {
    const bodyParagraphs = (data.paragraphs || []).map((text) =>
        new Paragraph({
            children: [
                new TextRun({
                    text: text,
                    size: 24, // 12pt
                    font: "Calibri",
                }),
            ],
            spacing: { after: 240 }, // Space between paragraphs
        })
    );

    const doc = new Document({
        sections: [
            {
                properties: {
                    page: {
                        margin: {
                            top: 1440,  // 1 inch
                            right: 1440,
                            bottom: 1440,
                            left: 1440,
                        },
                    },
                },
                children: [
                    // Date (right-aligned)
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: data.date,
                                size: 24,
                                font: "Calibri",
                            }),
                        ],
                        alignment: AlignmentType.RIGHT,
                        spacing: { after: 480 }, // Blank line space after date
                    }),

                    // Greeting
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: data.greeting,
                                size: 24,
                                font: "Calibri",
                            }),
                        ],
                        spacing: { after: 240 },
                    }),

                    // Body paragraphs
                    ...bodyParagraphs,

                    // Closing
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: data.closing,
                                size: 24,
                                font: "Calibri",
                            }),
                        ],
                        spacing: { before: 240, after: 120 },
                    }),

                    // Applicant name
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: data.applicantName,
                                size: 24,
                                font: "Calibri",
                                bold: true,
                            }),
                        ],
                    }),
                ],
            },
        ],
    });

    return await Packer.toBlob(doc);
};

