export function apiUrl(path: string): string {
  return `/api${path}`;
}

export function api(path: string, init?: RequestInit): Promise<Response> {
  return fetch(apiUrl(path), { credentials: "include", ...init });
}
