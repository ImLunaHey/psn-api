import { AuthInvalid, PSNError } from './errors';
import type { Tokens } from './types';

const AUTH_URL = 'https://ca.account.sony.com/api/authz/v3/oauth/authorize';
const TOKEN_URL = 'https://ca.account.sony.com/api/authz/v3/oauth/token';

const CLIENT_ID = '09515159-7237-4370-9b40-3806e67c0891';
const CLIENT_SECRET = 'cPUXdEiPi0cMtMVWqCMz1tn7BBKdkLTI1uOwkE7dRuW0OhA8zw5cfGTqpBgrk5Iy';
const REDIRECT_URI = 'com.scee.psxandroid.scecompcall://redirect';
const SCOPE = 'psn:mobile.v2.core psn:clientapp';

type RawTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
};

export async function exchangeNpsso(npsso: string): Promise<Tokens> {
  const params = new URLSearchParams({
    access_type: 'offline',
    client_id: CLIENT_ID,
    response_type: 'code',
    scope: SCOPE,
    redirect_uri: REDIRECT_URI,
  });

  const res = await fetch(`${AUTH_URL}?${params.toString()}`, {
    method: 'GET',
    redirect: 'manual',
    headers: { Cookie: `npsso=${npsso}` },
  });

  const location = res.headers.get('location');
  if (!location) {
    throw new AuthInvalid(
      'NPSSO did not yield an auth code — token may be expired or invalid',
    );
  }

  const code = new URL(location).searchParams.get('code');
  if (!code) throw new AuthInvalid('Authorization code missing from redirect');

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
    token_format: 'jwt',
  });

  return tokenRequest(body);
}

export async function refreshTokens(refreshToken: string): Promise<Tokens> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    scope: SCOPE,
    token_format: 'jwt',
  });
  return tokenRequest(body);
}

async function tokenRequest(body: URLSearchParams): Promise<Tokens> {
  const auth = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new PSNError(`Token request failed: ${res.status} ${text}`);
  }

  const data = (await res.json()) as RawTokenResponse;
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
}
