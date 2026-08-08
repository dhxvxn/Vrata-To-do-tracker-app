// Client-side Google OAuth via Google Identity Services (GIS). No backend and
// no client secret — only the public Client ID (VITE_GOOGLE_CLIENT_ID) is used.
// The access token lives in memory; a localStorage flag remembers that the user
// chose to connect so we can silently re-request a token on next load.

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GIS_SRC = 'https://accounts.google.com/gsi/client';
const CONNECTED_FLAG = 'vrata_google_connected';

// Scopes: read the schedule + create/update/delete events for two-way sync.
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
].join(' ');

let tokenClient: any = null;
let accessToken: string | null = null;
let tokenExpiry = 0; // epoch ms
let gisLoading: Promise<void> | null = null;

export const isGoogleConfigured = (): boolean => !!CLIENT_ID;
export const wasConnected = (): boolean => localStorage.getItem(CONNECTED_FLAG) === '1';

// Inject the GIS script once.
const loadGis = (): Promise<void> => {
  if ((window as any).google?.accounts?.oauth2) return Promise.resolve();
  if (gisLoading) return gisLoading;

  gisLoading = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GIS_SRC}"]`);
    if (existing) { existing.addEventListener('load', () => resolve()); return; }
    const script = document.createElement('script');
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });
  return gisLoading;
};

const ensureTokenClient = async () => {
  if (!CLIENT_ID) throw new Error('Google Client ID is not configured.');
  await loadGis();
  if (!tokenClient) {
    tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: () => {}, // set per-request in signIn()
    });
  }
  return tokenClient;
};

/** Prompt the user to connect their Google account and obtain an access token. */
export const signIn = async (): Promise<string> => {
  const client = await ensureTokenClient();
  return new Promise<string>((resolve, reject) => {
    client.callback = (response: any) => {
      if (response.error) { reject(new Error(response.error)); return; }
      accessToken = response.access_token;
      tokenExpiry = Date.now() + (response.expires_in ?? 3600) * 1000;
      localStorage.setItem(CONNECTED_FLAG, '1');
      resolve(accessToken as string);
    };
    // Empty prompt lets Google skip the consent screen on repeat connects.
    client.requestAccessToken({ prompt: accessToken ? '' : 'consent' });
  });
};

/** Return a valid token, silently refreshing (or prompting) if needed. */
export const getToken = async (): Promise<string> => {
  if (accessToken && Date.now() < tokenExpiry - 60_000) return accessToken;
  return signIn();
};

export const isSignedIn = (): boolean => !!accessToken && Date.now() < tokenExpiry;

export const signOut = (): void => {
  if (accessToken && (window as any).google?.accounts?.oauth2) {
    (window as any).google.accounts.oauth2.revoke(accessToken, () => {});
  }
  accessToken = null;
  tokenExpiry = 0;
  localStorage.removeItem(CONNECTED_FLAG);
};
