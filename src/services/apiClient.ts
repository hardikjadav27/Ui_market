export function getAuthToken(): string | null {
  return localStorage.getItem("token");
}

async function parseError(response: Response): Promise<string> {
  try {
    const body = await response.json();
    return body.message ?? body.title ?? response.statusText;
  } catch {
    return response.statusText;
  }
}

export async function apiRequest<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
