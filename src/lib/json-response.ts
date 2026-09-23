/**
 * Safely read a fetch response that is expected to be JSON.
 *
 * Reverse proxies (nginx) return HTML error pages (413/502/504/…) for many
 * failures. Calling `res.json()` on those throws
 * `SyntaxError: Unexpected token '<', "<html><h...` which hides the real cause.
 * This helper never throws on the body format: it returns the parsed JSON (or
 * null), the raw text and the HTTP status so callers can show a clear message.
 */
export interface JsonResponse {
  ok: boolean
  status: number
  data: Record<string, unknown> | null
  text: string
  /** True when the body is not JSON (e.g. an HTML error page from a proxy). */
  isHtml: boolean
}

export async function readJsonResponse(res: Response): Promise<JsonResponse> {
  const text = await res.text()
  let data: Record<string, unknown> | null = null
  try {
    data = text ? (JSON.parse(text) as Record<string, unknown>) : null
  } catch {
    data = null
  }
  return {
    ok: res.ok,
    status: res.status,
    data,
    text,
    isHtml: data === null && text.length > 0 && text.trimStart().startsWith("<"),
  }
}

/** Build a human-readable error message for a non-OK response. */
export function responseErrorMessage(
  res: JsonResponse,
  fallback: string,
): string {
  if (res.data && typeof res.data.error === "string" && res.data.error.trim()) {
    return res.data.error
  }
  if (res.isHtml) {
    return `${fallback} (HTTP ${res.status})`
  }
  if (res.text.trim()) {
    return res.text.trim()
  }
  return `${fallback} (HTTP ${res.status})`
}