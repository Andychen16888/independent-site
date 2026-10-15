/** 该 pathname 是否需要上报（排除 API 与 Next 内部静态资源路径）。 */
export function isTrackablePath(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  return !pathname.startsWith("/api/") && !pathname.startsWith("/_next")
}
