/**
 * TikTok Integration — OAuth2 with PKCE (S256) + Video List
 *
 * TikTok's v2 API mandates PKCE (RFC 7636) for all authorization requests.
 * The flow works as follows:
 *
 *   1. /login   — Generate code_verifier → derive code_challenge (SHA-256, base64url)
 *                 Store code_verifier in an HttpOnly cookie.
 *                 Redirect browser to TikTok with code_challenge + code_challenge_method=S256.
 *
 *   2. /callback — Read code_verifier back from the cookie.
 *                  POST code + code_verifier to TikTok's token endpoint.
 *                  Store the returned access_token in memory, clear the cookie.
 *
 *   3. /videos  — Use the stored access_token to call TikTok's /v2/video/list/ endpoint.
 *
 *   4. /status  — Let the front end check connection state without side-effects.
 *
 * Environment variables (server/.env):
 *   TIKTOK_CLIENT_KEY      — TikTok app client key
 *   TIKTOK_CLIENT_SECRET   — TikTok app client secret
 *   TIKTOK_REDIRECT_URI    — e.g. http://localhost:4000/api/tiktok/callback
 *   FRONTEND_URL           — e.g. http://localhost:3000  (used for post-auth redirect)
 */

import { Router, type Request, type Response, type NextFunction } from 'express';
import crypto from 'crypto';
import https  from 'https';

// ── PKCE constants ────────────────────────────────────────────────────────────

const PKCE_COOKIE_NAME = 'tt_code_verifier';

// Cookie lifetime — slightly longer than TikTok's auth code TTL (10 min).
const PKCE_COOKIE_MAX_AGE_MS = 15 * 60 * 1000; // 15 minutes

// ── In-memory token store (sufficient for sandbox / demo) ─────────────────────

interface TokenStore {
  accessToken:  string;
  openId:       string;
  expiresAt:    number;   // ms since epoch
  refreshToken?: string;
}

let tokenStore: TokenStore | null = null;

// ── Helpers ───────────────────────────────────────────────────────────────────

function getTikTokConfig() {
  const clientKey    = process.env['TIKTOK_CLIENT_KEY'];
  const clientSecret = process.env['TIKTOK_CLIENT_SECRET'];
  const redirectUri  = process.env['TIKTOK_REDIRECT_URI'];

  if (!clientKey || !clientSecret || !redirectUri) {
    throw new Error(
      'Missing TikTok env vars: TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET, TIKTOK_REDIRECT_URI'
    );
  }

  return { clientKey, clientSecret, redirectUri };
}

/**
 * Generate a cryptographically random code_verifier (43–128 chars, unreserved
 * URL characters only — as specified in RFC 7636 §4.1).
 */
function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Derive the code_challenge from the verifier using SHA-256 + base64url
 * (PKCE "S256" method — RFC 7636 §4.2).
 */
function deriveCodeChallenge(verifier: string): string {
  return crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64url');
}

/**
 * Minimal HTTPS POST that avoids an axios dependency.
 */
function httpsPost(url: string, body: string, extraHeaders: Record<string, string> = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    const parsed  = new URL(url);
    const options = {
      hostname: parsed.hostname,
      port:     parsed.port || 443,
      path:     parsed.pathname + parsed.search,
      method:   'POST',
      headers: {
        'Content-Type':   'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
        ...extraHeaders,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end',  () => resolve(data));
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

/**
 * Authenticated POST to TikTok's JSON API (for /v2/video/list/).
 */
function tiktokApiPost(endpoint: string, accessToken: string, payload: object): Promise<unknown> {
  const body = JSON.stringify(payload);

  return new Promise((resolve, reject) => {
    const parsed  = new URL(`https://open.tiktokapis.com${endpoint}`);
    const options = {
      hostname: parsed.hostname,
      port:     443,
      path:     parsed.pathname + parsed.search,
      method:   'POST',
      headers: {
        Authorization:    `Bearer ${accessToken}`,
        'Content-Type':   'application/json; charset=UTF-8',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end',  () => resolve(JSON.parse(data)));
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── Router ────────────────────────────────────────────────────────────────────

export function createTikTokRouter(): Router {
  const router = Router();

  // ── 1. GET /api/tiktok/login ──────────────────────────────────────────────
  /**
   * PKCE step 1 of 2.
   *
   * • Generates a random code_verifier.
   * • Derives code_challenge = BASE64URL(SHA256(code_verifier)).
   * • Stores code_verifier in an HttpOnly cookie (15 min TTL).
   * • Redirects the browser to TikTok's OAuth2 consent page with:
   *     code_challenge, code_challenge_method=S256
   */
  router.get('/login', (req: Request, res: Response, next: NextFunction) => {
    try {
      const { clientKey, redirectUri } = getTikTokConfig();

      // PKCE
      const codeVerifier   = generateCodeVerifier();
      const codeChallenge  = deriveCodeChallenge(codeVerifier);

      // CSRF state token (in production, also validate this in /callback)
      const csrfState = crypto.randomBytes(16).toString('hex');

      // sameSite:'none' + secure:true is required so the browser sends this
      // cookie back on the cross-site redirect that returns from TikTok.
      res.cookie(PKCE_COOKIE_NAME, codeVerifier, {
        httpOnly: true,
        secure:   true,
        sameSite: 'none',
        maxAge:   300000, // 5 minutes — matches TikTok's auth code TTL
        path:     '/api/tiktok',
      });

      const params = new URLSearchParams({
        client_key:            clientKey,
        scope:                 'user.info.basic,video.list',
        response_type:         'code',
        redirect_uri:          redirectUri,
        state:                 csrfState,
        code_challenge:        codeChallenge,
        code_challenge_method: 'S256',
      });

      const authUrl = `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;
      res.redirect(authUrl);
    } catch (err) {
      next(err);
    }
  });

  // ── 2. GET /api/tiktok/callback ───────────────────────────────────────────
  /**
   * PKCE step 2 of 2.
   *
   * TikTok redirects here after the user consents. This handler:
   * • Reads the code_verifier from the HttpOnly cookie.
   * • POSTs code + code_verifier to TikTok's token endpoint.
   * • Clears the cookie and stores the returned access_token in memory.
   * • Redirects the browser back to the frontend.
   */
  router.get('/callback', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { clientKey, clientSecret, redirectUri } = getTikTokConfig();

      const { code, error, error_description } = req.query as Record<string, string>;

      // TikTok reported an error (e.g. user denied access)
      if (error) {
        return res.status(400).json({
          success: false,
          message: `TikTok authorization denied: ${error_description ?? error}`,
        });
      }

      if (!code) {
        return res.status(400).json({
          success: false,
          message: 'Authorization code missing from TikTok callback.',
        });
      }

      // Retrieve PKCE verifier from the HttpOnly cookie
      const codeVerifier = (req.cookies as Record<string, string>)[PKCE_COOKIE_NAME];

      if (!codeVerifier) {
        return res.status(400).json({
          success: false,
          message:
            'PKCE code_verifier cookie is missing or expired. ' +
            'Please restart the authorization flow via /api/tiktok/login.',
        });
      }

      // Clear the verifier cookie immediately — it's single-use
      res.clearCookie(PKCE_COOKIE_NAME, { path: '/api/tiktok' });

      // Exchange authorization code + code_verifier for tokens
      const formBody = new URLSearchParams({
        client_key:    clientKey,
        client_secret: clientSecret,
        code:          code,
        grant_type:    'authorization_code',
        redirect_uri:  redirectUri,
        code_verifier: codeVerifier,   // ← PKCE verifier
      }).toString();

      const raw = await httpsPost('https://open.tiktokapis.com/v2/oauth/token/', formBody);

      const tokenResponse = JSON.parse(raw) as {
        access_token?:      string;
        open_id?:           string;
        expires_in?:        number;
        refresh_token?:     string;
        error?:             string;
        error_description?: string;
        message?:           string;
      };

      if (tokenResponse.error || !tokenResponse.access_token) {
        const message =
          tokenResponse.error_description ??
          tokenResponse.message ??
          tokenResponse.error ??
          'Failed to obtain access token from TikTok.';
        return res.status(400).json({ success: false, message });
      }

      // Store in-memory
      tokenStore = {
        accessToken:  tokenResponse.access_token,
        openId:       tokenResponse.open_id ?? '',
        expiresAt:    Date.now() + (tokenResponse.expires_in ?? 86400) * 1000,
        refreshToken: tokenResponse.refresh_token,
      };

      console.log('✅ TikTok token stored — openId:', tokenStore.openId);

      // Redirect back to the frontend — the TikTokGallery component will
      // re-check /api/tiktok/status on mount and hide the authorize button.
      const frontendOrigin = process.env['FRONTEND_URL'] ?? 'http://localhost:3000';
      res.redirect(frontendOrigin);
    } catch (err) {
      next(err);
    }
  });

  // ── 3. GET /api/tiktok/videos ─────────────────────────────────────────────
  /**
   * Returns up to 10 of the most recent TikTok videos for the authorized account.
   */
  router.get('/videos', async (_req: Request, res: Response, next: NextFunction) => {
    try {
      if (!tokenStore) {
        return res.status(401).json({
          success: false,
          message: 'TikTok account not connected. Authorize via /api/tiktok/login.',
        });
      }

      if (Date.now() > tokenStore.expiresAt) {
        tokenStore = null;
        return res.status(401).json({
          success: false,
          message: 'TikTok access token expired. Re-authorize via /api/tiktok/login.',
        });
      }

      const fields = [
        'id',
        'title',
        'cover_image_url',
        'share_url',
        'view_count',
        'like_count',
        'comment_count',
        'share_count',
        'create_time',
      ].join(',');

      const data = await tiktokApiPost(
        `/v2/video/list/?fields=${encodeURIComponent(fields)}`,
        tokenStore.accessToken,
        { max_count: 10 }
      ) as {
        data?: {
          videos?: Array<{
            id:              string;
            title:           string;
            cover_image_url: string;
            share_url:       string;
            view_count:      number;
            like_count:      number;
            comment_count:   number;
            share_count:     number;
            create_time:     number;
          }>;
        };
        error?: { code: string; message: string };
      };

      if (data.error && data.error.code !== 'ok') {
        return res.status(502).json({
          success: false,
          message: data.error.message ?? 'TikTok API returned an error.',
        });
      }

      return res.json({ success: true, data: data.data?.videos ?? [] });
    } catch (err) {
      next(err);
    }
  });

  // ── 4. GET /api/tiktok/status ─────────────────────────────────────────────
  router.get('/status', (_req: Request, res: Response) => {
    if (!tokenStore || Date.now() > tokenStore.expiresAt) {
      tokenStore = null;
      return res.json({ success: true, connected: false });
    }

    return res.json({
      success:   true,
      connected: true,
      expiresAt: new Date(tokenStore.expiresAt).toISOString(),
    });
  });

  return router;
}
