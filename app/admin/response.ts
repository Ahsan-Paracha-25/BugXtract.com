/** Safely reads an admin API response, including an HTML error page from a proxy. */
export async function parseAdminResponse<T>(response: Response): Promise<T> {
  const body = await response.text();
  if (!body) return {} as T;
  try { return JSON.parse(body) as T; }
  catch { return { error: `The admin service is unavailable (HTTP ${response.status}). Please try again.` } as T; }
}
