const AUTH_TOKEN_KEY = 'gamehub.auth.token';

interface JwtPayload {
  exp?: number;
}

function isExpired(token: string): boolean {
  try {
    const payload = token.split('.')[1];
    if (!payload) return true;

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const decoded = JSON.parse(atob(padded)) as JwtPayload;

    return typeof decoded.exp !== 'number' || decoded.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

export function getAuthToken(): string | null {
  const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) return null;

  if (isExpired(token)) {
    clearAuthToken();
    return null;
  }

  return token;
}

export function setAuthToken(token: string): void {
  const normalizedToken = token.trim();
  if (!normalizedToken || isExpired(normalizedToken)) {
    clearAuthToken();
    return;
  }

  sessionStorage.setItem(AUTH_TOKEN_KEY, normalizedToken);
}

export function clearAuthToken(): void {
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
}
