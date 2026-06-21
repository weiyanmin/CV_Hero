import { NextRequest, NextResponse } from 'next/server';
import { parseFile } from '@/lib/parsers';
import { generateCoverLetter } from '@/lib/gemini';
import { fetchJobDescriptionFromURL } from '@/lib/scraper';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const cvFile = formData.get('cvFile') as File;
        const jobDescriptionText = formData.get('jobDescriptionText') as string | null;
        const jobDescriptionUrl = formData.get('jobDescriptionUrl') as string | null;
        const jobDescriptionFile = formData.get('jobDescriptionFile') as File | null;
        const turnstileToken = formData.get('turnstileToken') as string;

        // Verify Turnstile token (skip in dev if no secret key)
        const turnstileSecretKey = process.env.TURNSTILE_SECRET_KEY;
        if (turnstileSecretKey && turnstileToken && turnstileToken !== 'dev-mode-token') {
            const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    secret: turnstileSecretKey,
                    response: turnstileToken,
                }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyData.success) {
                console.error('Turnstile verification failed:', verifyData);
                return NextResponse.json({ error: 'Security verification failed. Please try again.' }, { status: 403 });
            }
        }

        // Validate CV file
        if (!cvFile) {
            return NextResponse.json({ error: 'No CV file uploaded.' }, { status: 400 });
        }

        if (cvFile.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: 'CV file size exceeds 5MB limit.' }, { status: 400 });
        }

        // 1. Parse CV text
        const cvText = await parseFile(cvFile);
        if (!cvText || cvText.length < 50) {
            return NextResponse.json({ error: 'Could not extract sufficient text from CV file.' }, { status: 400 });
        }

        // 2. Get job description text
        let jdText = '';

        if (jobDescriptionText && jobDescriptionText.trim().length > 0) {
            jdText = jobDescriptionText.trim();
        } else if (jobDescriptionUrl && jobDescriptionUrl.trim().length > 0) {
            jdText = await fetchJobDescriptionFromURL(jobDescriptionUrl.trim());
        } else if (jobDescriptionFile) {
            if (jobDescriptionFile.size > 5 * 1024 * 1024) {
                return NextResponse.json({ error: 'Job description file size exceeds 5MB limit.' }, { status: 400 });
            }
            jdText = await parseFile(jobDescriptionFile);
        }

        if (!jdText || jdText.length < 20) {
            return NextResponse.json({ error: 'Job description is too short. Please provide at least 20 characters.' }, { status: 400 });
        }

        // 3. Generate cover letter
        const coverLetterData = await generateCoverLetter(cvText, jdText);

        return NextResponse.json({ success: true, data: coverLetterData });
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
