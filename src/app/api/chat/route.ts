import { NextRequest } from "next/server"
import OpenAI from "openai"
import { buildSystemPrompt } from "@/lib/ai/system-prompt"
import { isRateLimited, clientIp } from "@/lib/ai/rate-limit"
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const CHAT_TIMEOUT_MS = Number(process.env.CHAT_TIMEOUT_MS) || 90_000
const MAX_HISTORY = 20
const MAX_INPUT_LENGTH = 2000
const MAX_OUTPUT_TOKENS = 600

// Failure defense for the AI stream.
//
// Two problems were killing the whole site (client + admin) every day:
//
// 1. Memory: the old rate limiter here used a module-level Map of client-IP
//    buckets that was NEVER evicted. Every unique visitor (or crawler, which
//    hits /api/chat with real and spoofed X-Forwarded-For IPs) added a
//    permanent entry, so the map grew without limit 24/7. On this long-running
//    pm2 process that eventually crossed the 2G heap cap → OOM → restart, and
//    because every page is dynamic SSR (no ISR, no caching) the ENTIRE site
//    (client AND admin, which is also SSR) returned 504 until the process came
//    back.
//
//    The rate limiter now lives in src/lib/ai/rate-limit.ts, which is bounded:
//    expired buckets are dropped on access and a periodic sweep prunes stale
//    entries once the table grows large, so memory usage is fixed.
//
// 2. Hangs: an OpenAI stream can stall for the SDK's default 10-minute timeout
//    (with up to 2 internal retries). Each stalled request ties up a handler +
//    response stream and, on a busy site, several of these piling up over the
//    day is exactly what tips the process over the /api 360s nginx timeout
//    (504) for everyone.
//
//    So every chat call now gets a hard wall-clock timeout (aborts the stream,
//    upstream socket, and buffers) and is aborted immediately if the client
//    disconnects, so no request can ever leak memory or hang past its bound.

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return jsonError("The AI assistant is not configured yet. Please contact the admin.", 503)
  }

  const ip = clientIp(req)
  if (isRateLimited(ip)) {
    return jsonError("You are sending messages too quickly. Please slow down and try again.", 429)
  }

  let payload: { messages?: unknown }
  try {
    payload = await req.json()
  } catch {
    return jsonError("Invalid request body.", 400)
  }

  if (!Array.isArray(payload.messages) || payload.messages.length === 0) {
    return jsonError("Messages array is required.", 400)
  }

  const history = (payload.messages as { role?: string; content?: string }[])
    .filter(
      (m) =>
        (m?.role === "user" || m?.role === "assistant") &&
        typeof m?.content === "string"
    )
    .slice(-MAX_HISTORY)
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: (m.content as string).slice(0, MAX_INPUT_LENGTH),
    }))

  if (history.length === 0) {
    return jsonError("Messages array is required.", 400)
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  try {
    const systemPrompt = await buildSystemPrompt()

    const stream = await openai.chat.completions.create(
      {
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...(history as ChatCompletionMessageParam[]),
        ],
        temperature: 0.7,
        max_tokens: MAX_OUTPUT_TOKENS,
        stream: true,
      },
      {
        maxRetries: 0,
        timeout: CHAT_TIMEOUT_MS,
        signal: req.signal,
      }
    )

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || ""
            if (content) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`))
            }
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`))
        } catch (error) {
          console.error("Stream error:", error)
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: "The response was interrupted. Please try again." })}\n\n`
            )
          )
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    })
  } catch (error: unknown) {
    console.error("Chat API error:", error)
    const status = (error as { status?: number })?.status
    if (status === 401) {
      return jsonError("The AI service authentication failed. Please contact the admin.", 502)
    }
    if (status === 429) {
      return jsonError("The AI service is busy right now. Please try again in a moment.", 503)
    }
    return jsonError("Internal Server Error", 500)
  }
}