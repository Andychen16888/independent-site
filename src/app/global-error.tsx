"use client"

// Fallback boundary for errors thrown in the root layout itself. It replaces the
// root layout, so it cannot rely on next-intl providers or the global stylesheet
// and renders its own <html>/<body> with inline styles. Keep it dependency-free.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#faf7f2",
          color: "#1c1c1c",
          fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: "420px", textAlign: "center" }}>
          <p style={{ fontSize: "64px", margin: "0 0 16px", color: "#d8cfc4" }}>500</p>
          <h1 style={{ fontSize: "22px", fontWeight: 400, margin: "0 0 12px" }}>
            Something Went Wrong
          </h1>
          <p style={{ fontSize: "14px", color: "#6b6b6b", margin: "0 0 24px" }}>
            An unexpected error occurred. Please try again later.
          </p>
          <button
            onClick={() => reset()}
            style={{
              background: "#1c1c1c",
              color: "#fff",
              border: "none",
              padding: "12px 24px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Try Again
          </button>
          {error.digest && (
            <p style={{ fontSize: "12px", color: "#9b9b9b", marginTop: "24px" }}>
              Reference code: <code>{error.digest}</code>
            </p>
          )}
        </div>
      </body>
    </html>
  )
}
