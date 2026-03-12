// =============================================================================
// Auth State Manager — localStorage-based JWT token management
// =============================================================================

const TOKEN_KEY = 'nyayasetu_token';
const USERNAME_KEY = 'nyayasetu_username';

/** Reactive listeners for auth state changes. */
type AuthListener = () => void;
const listeners = new Set<AuthListener>();

function notify() {
  listeners.forEach((fn) => fn());
}

export function onAuthChange(listener: AuthListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUsername(): string | null {
  return localStorage.getItem(USERNAME_KEY);
}

export function setAuth(token: string, username: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USERNAME_KEY, username);
  notify();
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USERNAME_KEY);
  notify();
}

export function isLoggedIn(): boolean {
  return !!getToken();
}
