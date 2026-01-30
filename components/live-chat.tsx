"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useWallet } from "@/lib/wallet-context"
import { signAuth } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { gameSounds } from "@/lib/sounds"

interface ChatMessage {
  id: string
  user: string
  message: string
  timestamp: Date
  isSystem?: boolean
}

export function LiveChat() {
  const { connected, publicKey } = useWallet()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const lastCreatedAtRef = useRef<string | null>(null)
  const seenIdsRef = useRef<Set<string>>(new Set())

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const formatUser = useCallback((walletAddress: string, username: string | null) => {
    if (username) return username
    return `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
  }, [])

  const loadInitial = useCallback(async () => {
    try {
      const res = await fetch("/api/chat?limit=50")
      if (!res.ok) return
      const data = await res.json()
      const rows = (data?.messages || []) as Array<any>

      const mapped: ChatMessage[] = rows.map((row) => {
        const walletAddress = String(row.walletAddress || "")
        const username = row.username ?? null
        const createdAt = String(row.createdAt || "")
        return {
          id: String(row.id),
          user: formatUser(walletAddress, username),
          message: String(row.message || ""),
          timestamp: createdAt ? new Date(createdAt) : new Date(),
        }
      })

      if (rows.length) {
        lastCreatedAtRef.current = String(rows[rows.length - 1].createdAt)
      }

      seenIdsRef.current = new Set(mapped.map((msg) => msg.id))
      setMessages(mapped)
    } catch (err) {
      console.error("Failed to load chat:", err)
    }
  }, [formatUser])

  const pollNew = useCallback(async () => {
    try {
      const after = lastCreatedAtRef.current
      const url = after ? `/api/chat?after=${encodeURIComponent(after)}&limit=50` : "/api/chat?limit=50"
      const res = await fetch(url)
      if (!res.ok) return
      const data = await res.json()
      const rows = (data?.messages || []) as Array<any>
      if (!rows.length) return

      const mapped: ChatMessage[] = rows.map((row) => {
        const walletAddress = String(row.walletAddress || "")
        const username = row.username ?? null
        const createdAt = String(row.createdAt || "")
        return {
          id: String(row.id),
          user: formatUser(walletAddress, username),
          message: String(row.message || ""),
          timestamp: createdAt ? new Date(createdAt) : new Date(),
        }
      })

      const newItems = mapped.filter((msg) => !seenIdsRef.current.has(msg.id))
      if (!newItems.length) return

      newItems.forEach((msg) => seenIdsRef.current.add(msg.id))
      lastCreatedAtRef.current = String(rows[rows.length - 1].createdAt)
      setMessages((prev) => [...prev, ...newItems])
    } catch (err) {
      console.error("Failed to poll chat:", err)
    }
  }, [formatUser])

  useEffect(() => {
    void loadInitial()
  }, [loadInitial])

  useEffect(() => {
    const interval = setInterval(() => {
      void pollNew()
    }, 3000)
    return () => clearInterval(interval)
  }, [pollNew])

  const handleSend = async () => {
    const clean = input.trim()
    if (!clean || !connected || !publicKey || isSending) return

    gameSounds.click()

    try {
      setIsSending(true)

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: publicKey, message: clean }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || "Failed to send message")
      }

      const row = data?.message
      const walletAddress = String(row?.walletAddress || publicKey)
      const username = row?.username ?? null
      const createdAt = String(row?.createdAt || new Date().toISOString())

      lastCreatedAtRef.current = createdAt

      const nextMessage: ChatMessage = {
        id: String(row?.id || Date.now().toString()),
        user: formatUser(walletAddress, username),
        message: String(row?.message || clean),
        timestamp: new Date(createdAt),
      }

      if (!seenIdsRef.current.has(nextMessage.id)) {
        seenIdsRef.current.add(nextMessage.id)
        setMessages((prev) => [...prev, nextMessage])
      }
      setInput("")
    } catch (err) {
      console.error("Chat send error:", err)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="flex flex-col h-full glass-panel rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b border-[#1a3a4a]/50 bg-[#0a1628]/80">
        <MessageCircle className="h-4 w-4 text-[#00d4aa]" />
        <span className="text-sm font-semibold text-[#e8f4f8]">Live Chat</span>
        <div className="ml-auto flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-[#00d4aa] animate-pulse" />
          <span className="text-xs text-[#6b8a9a]">{messages.length}</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {messages.map((msg) => (
          <div key={msg.id} className="text-sm">
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-primary text-xs">{msg.user}</span>
              <span className="text-[10px] text-muted-foreground">{formatTime(msg.timestamp)}</span>
            </div>
            <p className="text-foreground/90 text-xs break-words">{msg.message}</p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-2 border-t border-border bg-secondary/20">
        {connected ? (
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="h-8 text-xs bg-background"
              maxLength={200}
            />
            <Button
              size="sm"
              onClick={handleSend}
              disabled={!input.trim()}
              className="h-8 w-8 p-0"
            >
              <Send className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div className="text-center text-xs text-muted-foreground py-1">
            Connect wallet to chat
          </div>
        )}
      </div>
    </div>
  )
}
