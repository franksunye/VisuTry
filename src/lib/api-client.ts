/**
 * Unified API client for browser-side fetch calls.
 *
 * Provides type-safe, consistent error handling and response parsing
 * for all client-side API interactions.
 *
 * Usage:
 *   const data = await apiClient.get<HistoryData>('/api/try-on/history')
 *   const result = await apiClient.post<SubmitResult>('/api/try-on/submit', formData)
 */

// ── Error Class ────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// ── Types ──────────────────────────────────────────────

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

interface RequestOptions {
  /** Use keepalive for fire-and-forget requests (e.g., analytics). */
  keepalive?: boolean
  /** Custom headers. */
  headers?: Record<string, string>
  /** Abort signal for cancellation. */
  signal?: AbortSignal
}

// ── Core ───────────────────────────────────────────────

async function request<T>(
  url: string,
  init: RequestInit & RequestOptions,
): Promise<T> {
  const { keepalive, headers: customHeaders, signal, ...rest } = init

  const response = await fetch(url, {
    ...rest,
    keepalive,
    signal,
    headers: {
      ...(rest.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...customHeaders,
    },
  })

  // Handle non-JSON responses (e.g., HEAD requests)
  if (response.status === 204) {
    return undefined as T
  }

  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null

  if (!response.ok) {
    const message = payload?.error || `Request failed with status ${response.status}`
    throw new ApiError(message, response.status, payload)
  }

  if (payload && payload.success === false) {
    throw new ApiError(payload.error || 'Request failed', response.status, payload)
  }

  // If the API wraps data in { success, data }, unwrap it
  if (payload && 'data' in payload && payload.success === true) {
    return payload.data as T
  }

  // Otherwise return the payload directly
  return (payload as unknown) as T
}

// ── Public API ─────────────────────────────────────────

export const apiClient = {
  /** GET request, returns parsed data. */
  get<T>(url: string, options?: RequestOptions): Promise<T> {
    return request<T>(url, { method: 'GET', ...options })
  },

  /** POST request with JSON body. */
  post<T>(url: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>(url, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    })
  },

  /** POST request with FormData body (no Content-Type header). */
  postForm<T>(url: string, formData: FormData, options?: RequestOptions): Promise<T> {
    return request<T>(url, {
      method: 'POST',
      body: formData,
      ...options,
    })
  },

  /** DELETE request. */
  delete<T>(url: string, options?: RequestOptions): Promise<T> {
    return request<T>(url, { method: 'DELETE', ...options })
  },

  /** HEAD request (returns response, not parsed data). */
  async head(url: string, options?: RequestOptions): Promise<Response> {
    return fetch(url, { method: 'HEAD', ...options })
  },
}
