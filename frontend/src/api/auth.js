/**
 * JWT Token helpers.
 * The token is stored in localStorage under the key "om_token".
 */

const TOKEN_KEY = "om_token";

export function saveToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || null;
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Returns headers object with Authorization: Bearer <token> if token exists.
 */
export function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
