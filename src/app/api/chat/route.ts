import { NextRequest } from "next/server"
import OpenAI from "openai"
import { buildSystemPrompt } from "@/lib/ai/system-prompt"
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const API_KEY = process.env.OPENAI_API_KEY
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini"
const MAX_HISTORY = 20
const MAX_INPUT_LENGTH = 2000
const MAX_OUTPUT_TOKENS = 600

// Simple in-memory rate limiter: N requests per 60s per client IP.
const RATE_LIMIT = Number(process.env.CHAT_RATE_LIMIT) || 20
const RATE_WINDOW_MS = 60_000
const buckets = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const bucket = buckets.get(ip)
  if (!bucket || bucket.resetAt < now) {
    buckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return false
  }
  bucket.count += 1
  if (bucket.count > RATE_LIMIT) return true
  return false
}

function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  return req.headers.get("x-real-ip") || "unknown"
}

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

export async function POST(req: NextRequest) {
  if (!API_KEY) {
    return jsonError("The AI assistant is not configured yet. Please contact the admin.", 503)
  }

  const ip = clientIp(req)
  if (isRateLimited(ip)) {
    return jsonError("You're sending messages too quickly. Please wait a moment and try again.", 429)
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
    return jsonError("No valid messages provided.", 400)
  }

  const openai = new OpenAI({ apiKey: API_KEY })

  try {
    const systemPrompt = await buildSystemPrompt()

    const stream = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "system", content: systemPrompt }, ...(history as ChatCompletionMessageParam[])],
      temperature: 0.7,
      max_tokens: MAX_OUTPUT_TOKENS,
      stream: true,
    })

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
            encoder.encode(`data: ${JSON.stringify({ error: "The response was interrupted. Please try again." })}\n\n`)
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