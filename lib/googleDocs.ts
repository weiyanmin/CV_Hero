import { CVData } from './gemini';

interface DocsRequest {
    title: string;
    requests: any[];
}

export async function createGoogleDoc(accessToken: string, cvData: CVData): Promise<string> {
    // Step 1: Create a blank document
    const createResponse = await fetch('https://docs.googleapis.com/v1/documents', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            title: `${cvData.fullName} - CV`,
        }),
    });

    if (!createResponse.ok) {
        const error = await createResponse.text();
        throw new Error(`Failed to create document: ${error}`);
    }

    const doc = await createResponse.json();
    const documentId = doc.documentId;

    // Step 2: Build the content requests
    const requests = buildDocumentRequests(cvData);

    // Step 3: Update the document with content
    const updateResponse = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requests }),
    });

    if (!updateResponse.ok) {
        const error = await updateResponse.text();
        throw new Error(`Failed to update document: ${error}`);
    }

    // Return the Google Docs URL
    return `https://docs.google.com/document/d/${documentId}/edit`;
}

function buildDocumentRequests(cvData: CVData): any[] {
    const requests: any[] = [];
    let index = 1; // Google Docs index starts at 1

    // Helper to insert text
    const insertText = (text: string, bold = false, italic = false, fontSize = 11) => {
        if (!text) return;
        const endIndex = index + text.length;
        requests.push({
            insertText: {
                location: { index },
                text,
            },
        });

        if (bold || italic || fontSize !== 11) {
            requests.push({
                updateTextStyle: {
                    range: { startIndex: index, endIndex },
                    textStyle: {
                        bold,
                        italic,
                        fontSize: { magnitude: fontSize, unit: 'PT' },
                    },
                    fields: 'bold,italic,fontSize',
                },
            });
        }

        index = endIndex;
    };

    const insertNewline = () => {
        requests.push({
            insertText: {
                location: { index },
                text: '\n',
            },
        });
        index += 1;
    };

    // Name (centered, large)
    const name = cvData.fullName.toUpperCase();
    insertText(name, true, false, 18);
    insertNewline();

    // Contact info
    const contactParts = [
        cvData.contactInfo.email,
        cvData.contactInfo.phone,
        cvData.contactInfo.linkedin,
        cvData.contactInfo.location,
    ].filter(Boolean);
    insertText(contactParts.join(' | '), false, false, 10);
    insertNewline();
    insertNewline();

    // Summary section
    insertText('PROFESSIONAL SUMMARY', true, false, 12);
    insertNewline();
    insertText(cvData.summary);
    insertNewline();
    insertNewline();

    // Experience section
    insertText('WORK EXPERIENCE', true, false, 12);
    insertNewline();

    for (const job of cvData.experience) {
        insertText(job.role, true);
        insertText(` - ${job.company}`, false, true);
        insertText(` | ${job.duration}`);
        insertNewline();

        for (const bullet of job.description) {
            insertText(`• ${bullet}`);
            insertNewline();
        }
        insertNewline();
    }

    // Education section
    insertText('EDUCATION', true, false, 12);
    insertNewline();

    for (const edu of cvData.education) {
        insertText(edu.institution, true);
        insertText(` - ${edu.degree}`, false, true);
        insertText(` | ${edu.year}`);
        insertNewline();
    }
    insertNewline();

    // Skills section
    insertText('SKILLS', true, false, 12);
    insertNewline();
    insertText(cvData.skills.join(' • '));
    insertNewline();

    // Projects section (if any)
    if (cvData.projects && cvData.projects.length > 0) {
        insertNewline();
        insertText('PROJECTS', true, false, 12);
        insertNewline();

        for (const proj of cvData.projects) {
            insertText(proj.name, true);
            insertNewline();
            insertText(proj.description);
            if (proj.link) {
                insertNewline();
                insertText(proj.link, false, true);
            }
            insertNewline();
        }
    }

    return requests;
}
