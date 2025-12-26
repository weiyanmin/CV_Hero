import { NextRequest, NextResponse } from 'next/server';
import { parseFile } from '@/lib/parsers';
import { optimizeCV } from '@/lib/gemini';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
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

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: 'File size exceeds 5MB limit.' }, { status: 400 });
        }

        // 1. Parse File text
        const text = await parseFile(file);
        if (!text || text.length < 50) {
            return NextResponse.json({ error: 'Could not extract sufficient text from file.' }, { status: 400 });
        }

        // 2. Optimization
        const cvData = await optimizeCV(text);

        return NextResponse.json({ success: true, data: cvData });
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
