"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { marked } from "marked"
import DOMPurify from "isomorphic-dompurify"
import { HiOutlineXMark, HiOutlinePaperAirplane, HiOutlineSparkles, HiOutlineArrowPath } from "react-icons/hi2"
import { ProductSuggestions } from "./ProductSuggestions"
import type { ChatProduct } from "./types"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface ChatWidgetProps {
  trigger: React.ReactNode
  products?: ChatProduct[]
}

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "our store"

const WELCOME_MESSAGE: Message = {
  role: "assistant",
  content: `Hello! I'm your personal shopping assistant at ${siteName}. I can help you find products, compare options, check shipping, or learn about us. How can I help you today?`
}

const SUGGESTED_QUESTIONS = [
  "What's the fastest delivery option?",
  "Do you offer wholesale or bulk pricing?",
  "What's your return policy?",
  "Show me your best sellers",
  "Do you ship internationally?",
  "How do I track my order?",
]

marked.setOptions({ gfm: true, breaks: true })

function renderMarkdown(content: string): string {
  try {
    return DOMPurify.sanitize(marked.parse(content) as string)
  } catch {
    return content
  }
}

export function ChatWidget({ trigger, products = [] }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100)
      inputRef.current?.focus()
    }
  }, [isOpen, messages, scrollToBottom])

  const resetChat = () => {
    setMessages([WELCOME_MESSAGE])
    setInput("")
  }

  const handleSend = async (text?: string) => {
    const content = text || input
    if (!content.trim() || isLoading) return

    const userMessage: Message = { role: "user", content: content.trim().slice(0, 2000) }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput("")
    setIsLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.slice(-20).map((m) => ({ role: m.role, content: m.content })),
        }),
      })

      if (!res.ok) {
        let errorText = "Chat request failed"
        try {
          const data = await res.json()
          if (data?.error) errorText = data.error
        } catch {}
        throw new Error(errorText)
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error("No reader available")

      let assistantContent = ""
      setMessages((prev) => [...prev, { role: "assistant", content: "" }])

      let streamError: string | null = null
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        const lines = chunk.split("\n").filter((l) => l.startsWith("data: "))

        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6))
            if (data.done) break
            if (data.content) {
              assistantContent += data.content
              setMessages((prev) => {
                const next = [...prev]
                next[next.length - 1] = { role: "assistant", content: assistantContent }
                return next
              })
            } else if (data.error) {
              streamError = data.error
            }
          } catch {
            // Ignore malformed chunks but continue streaming
          }
          if (streamError) break
        }
        if (streamError) break
      }

      if (streamError) {
        throw new Error(streamError)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : ""
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `I apologize, but I couldn't complete that request${message ? `: ${message}` : ""}. Please try again or contact our support team.`,
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      <button onClick={() => setIsOpen(true)} aria-label="Open chat">
        {trigger}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-32px)] h-[600px] max-h-[calc(100vh-120px)] bg-ivory shadow-2xl border border-mist flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-mist bg-charcoal text-ivory flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gold/20 rounded-full flex items-center justify-center">
                  <HiOutlineSparkles className="w-4 h-4 text-gold" />
                </div>
                <div>
                  <p className="text-sm font-medium">{siteName}</p>
                  <p className="text-[10px] text-ivory/60 tracking-wider uppercase">AI Sales Assistant</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={resetChat}
                  title="Start a new conversation"
                  className="p-1.5 hover:bg-white/10 rounded transition-colors"
                >
                  <HiOutlineArrowPath className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded transition-colors"
                >
                  <HiOutlineXMark className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-charcoal text-ivory rounded-tl-lg rounded-tr-lg rounded-bl-lg"
                        : "bg-cream text-charcoal rounded-tr-lg rounded-br-lg rounded-bl-lg"
                    }`}
                  >
                    {msg.content ? (
                      msg.role === "user" ? (
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      ) : (
                        <div
                          className="ai-markdown break-words"
                          dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                        />
                      )
                    ) : (
                      msg.role === "assistant" &&
                      i === messages.length - 1 &&
                      isLoading && (
                        <span className="inline-flex gap-1">
                          <span className="w-2 h-2 bg-stone rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-2 h-2 bg-stone rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-2 h-2 bg-stone rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </span>
                      )
                    )}
                  </div>
                </div>
              ))}

              {messages.length === 1 && (
                <div className="pt-2">
                  <p className="text-xs text-stone mb-3 tracking-wider uppercase">Quick Questions</p>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTED_QUESTIONS.map((q) => (
                      <button
                        key={q}
                        onClick={() => handleSend(q)}
                        disabled={isLoading}
                        className="text-xs px-3 py-2 bg-mist text-stone hover:bg-charcoal hover:text-ivory transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {products.length > 0 && <ProductSuggestions products={products} />}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-mist px-4 py-3 flex-shrink-0">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything..."
                  disabled={isLoading}
                  maxLength={2000}
                  className="flex-1 px-4 py-2.5 bg-cream text-sm outline-none border border-transparent focus:border-charcoal/30 transition-colors placeholder:text-stone/50"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  className="p-2.5 bg-charcoal text-ivory hover:bg-charcoal/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <HiOutlinePaperAirplane className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-stone/50 mt-2 text-center">
                Powered by OpenAI — Responses are AI-generated.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}