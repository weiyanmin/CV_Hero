// Google OAuth configuration
export const GOOGLE_CLIENT_ID = '947335786362-ngdmkj6eocb1164edj77r8drjje1mkk6.apps.googleusercontent.com';

// Scopes needed for Google Docs
export const GOOGLE_SCOPES = [
    'https://www.googleapis.com/auth/documents',
    'https://www.googleapis.com/auth/drive.file'
].join(' ');

// Build OAuth URL
export function getGoogleAuthUrl(redirectUri: string, state?: string): string {
    const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: 'token',
        scope: GOOGLE_SCOPES,
        include_granted_scopes: 'true',
        state: state || '',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}
