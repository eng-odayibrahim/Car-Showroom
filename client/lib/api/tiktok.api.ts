/**
 * TikTok API client — mirrors the pattern in cars.api.ts.
 *
 * All calls go to the backend (/api/tiktok/*) which handles the TikTok
 * OAuth2 flow and proxies the TikTok v2 API. The browser never talks
 * directly to TikTok.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TikTokVideo {
  id:              string;   // normalised on the backend: id || item_id
  item_id?:        string;   // raw field TikTok may return instead of id
  title:           string;
  cover_image_url: string;
  share_url:       string;
  view_count:      number;
  like_count:      number;
  comment_count:   number;
  share_count:     number;
  create_time:     number; // Unix timestamp (seconds)
}

export interface TikTokVideosResponse {
  success: boolean;
  data:    TikTokVideo[];
}

export interface TikTokStatusResponse {
  success:    boolean;
  connected:  boolean;
  expiresAt?: string; // ISO-8601 string, only when connected === true
}

// ── Base URL resolution ───────────────────────────────────────────────────────

const clientEnv   = process.env['NEXT_PUBLIC_API_URL'];   // e.g. 'http://localhost:4000/api'
const internalEnv = process.env['NEXT_PUBLIC_INTERNAL_API_URL'];

const stripTrailing = (u?: string) => (u ? u.replace(/\/+$/, '') : undefined);

const clientBase   = stripTrailing(clientEnv);
const internalBase = stripTrailing(internalEnv);

let BASE_URL: string;
if (typeof window === 'undefined') {
  // Server-side (SSR / RSC)
  const base = internalBase ?? (clientBase ? clientBase.replace(/\/api$/, '') : 'http://localhost:4000');
  BASE_URL = base.endsWith('/api') ? base : `${base}/api`;
} else {
  // Browser
  const origin = window.location.origin;
  const base = clientBase ?? `${origin}/api`;
  BASE_URL = base.endsWith('/api') ? base : `${base}/api`;
}

// ── Internal fetch wrapper ────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res  = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  const json = (await res.json()) as { success: boolean; message?: string } & T;

  if (!res.ok || !json.success) {
    throw new Error(json.message ?? `API error ${res.status}`);
  }

  return json;
}

// ── TikTok API ────────────────────────────────────────────────────────────────

export const tiktokApi = {
  /**
   * Check whether the backend has a valid TikTok access token stored.
   * Use this on mount to decide whether to show the "Authorize" button
   * or go straight to loading videos.
   */
  status(): Promise<TikTokStatusResponse> {
    return apiFetch<TikTokStatusResponse>('/tiktok/status');
  },

  /**
   * Fetch the 10 latest TikTok videos for the authorized account.
   * Returns an empty array if no videos are available in the sandbox.
   */
  videos(): Promise<TikTokVideosResponse> {
    return apiFetch<TikTokVideosResponse>('/tiktok/videos');
  },
};
