import { AsyncLocalStorage } from "async_hooks"

export interface RequestMeta {
  ip: string | null
  userAgent: string | null
}

export const requestStorage = new AsyncLocalStorage<RequestMeta>()

export function getRequestMeta(): RequestMeta | null {
  return requestStorage.getStore() ?? null
}