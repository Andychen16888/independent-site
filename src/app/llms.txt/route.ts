import { buildLlmsContent } from "@/lib/seo/llms"

export const dynamic = "force-dynamic"

export async function GET() {
  const body = await buildLlmsContent(false)
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  })
}