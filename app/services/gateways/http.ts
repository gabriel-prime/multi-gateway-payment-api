/**
 * Wrapper sobre fetch nativo. Lança em respostas não-OK (4xx/5xx). Suporta timeout via AbortSignal.
 */
async function request<T>(
  url: string,
  options: RequestInit & { timeoutMs?: number }
): Promise<T> {
  const { timeoutMs = 10_000, ...fetchOptions } = options

  const res = await fetch(url, {
    ...fetchOptions,
    signal: AbortSignal.timeout(timeoutMs),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`HTTP ${res.status} – ${text}`)
  }

  const text = await res.text()
  return (text ? JSON.parse(text) : undefined) as T
}

export function postJson<T>(
  url: string,
  body: unknown,
  options: { headers?: Record<string, string>; timeoutMs?: number } = {}
): Promise<T> {
  return request<T>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    body: JSON.stringify(body),
    timeoutMs: options.timeoutMs,
  })
}

export function getJson<T>(
  url: string,
  options: { headers?: Record<string, string>; timeoutMs?: number } = {}
): Promise<T> {
  return request<T>(url, {
    method: 'GET',
    headers: options.headers,
    timeoutMs: options.timeoutMs,
  })
}
