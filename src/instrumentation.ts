// Next.js server instrumentation.
//
// onRequestError runs for every server-side request error and logs the route
// plus the error digest. The digest is the same value surfaced on the error page
// (`errorReference`), so a user-reported "Something Went Wrong" can be matched
// to the exact server log line. Without this, server errors were only visible as
// the generic `⨯` lines that Next emits.
const IGNORED_DIGESTS = ["NEXT_NOT_FOUND"]

export function onRequestError(
  error: unknown,
  request: { path: string; method: string },
  context: { routerKind: string; routePath: string; routeType: string }
) {
  const digest =
    error && typeof error === "object" && "digest" in error
      ? (error as { digest?: unknown }).digest
      : undefined

  // Redirects/notFound use thrown control-flow signals; they are not failures.
  if (
    typeof digest === "string" &&
    (digest.startsWith("NEXT_REDIRECT") || IGNORED_DIGESTS.includes(digest))
  ) {
    return
  }

  console.error(
    `[request-error] ${request.method} ${request.path} route=${context.routePath} ` +
      `kind=${context.routerKind}/${context.routeType} digest=${
        typeof digest === "string" ? digest : "n/a"
      }`
  )
}
