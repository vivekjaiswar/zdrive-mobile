import axios from 'axios';

export const API_BASE_URL = 'https://zhdrive.in/api';

// Public web app origin (used to turn the backend's relative share
// paths, e.g. "/share/:token", into absolute links we can hand to
// Share.share() / Linking.openURL()).
export const WEB_BASE_URL = 'https://zhdrive.in';

// Static pages served directly by the web server (not the API) -
// update these paths if the hosted location changes.
export const PRIVACY_POLICY_URL = `${WEB_BASE_URL}/privacy`;
export const TERMS_OF_SERVICE_URL = `${WEB_BASE_URL}/terms`;

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  // Backend v1.2.1 moved the session token out of the JSON response body
  // and into an httpOnly cookie (zd_session) - JwtStrategy only reads
  // that cookie now, there is no Authorization-header fallback. This
  // flag tells React Native's native networking layer (NSHTTPCookieStorage
  // on iOS, OkHttp's cookie jar on Android) to store Set-Cookie responses
  // and re-attach them on subsequent requests, the same way a browser
  // would. Nothing else in this app can read or set that cookie directly -
  // it's httpOnly by design, specifically so client-side JS can't touch it.
  withCredentials: true,
});

// Registered-handler pattern: api.ts can't import auth.store.ts directly
// (auth.store.ts already imports api.ts - that'd be a circular import),
// so the app bootstrap calls setUnauthorizedHandler() once to wire this
// up instead.
let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: () => void) {
  unauthorizedHandler = handler;
}

// These auth endpoints can legitimately return 401 as a normal
// business-logic response (wrong password, unverified email, expired
// reset/verify token, etc.) - a 401 from any of these must NOT trigger
// a global auto-logout, since there's no session to log out of yet.
const AUTH_ENDPOINTS_EXCLUDED_FROM_AUTO_LOGOUT = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
  '/auth/resend-verification',
  '/auth/change-password',
];

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url: string = error?.config?.url ?? '';

    const isExcluded = AUTH_ENDPOINTS_EXCLUDED_FROM_AUTO_LOGOUT.some((path) =>
      url.includes(path),
    );

    if (status === 401 && !isExcluded && unauthorizedHandler) {
      unauthorizedHandler();
    }

    return Promise.reject(error);
  },
);

export default api;