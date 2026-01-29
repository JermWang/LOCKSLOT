"use client"

import { useState, useRef, useEffect } from "react"
import { useWallet } from "@/lib/wallet-context"
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
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = () => {
    if (!input.trim() || !connected) return

    gameSounds.click()
    
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      user: publicKey ? `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}` : "anon",
      message: input.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, newMessage])
    setInput("")
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
      <div className="flex items-center gap-2 p-3 border-b border-border bg-secondary/30">
        <MessageCircle className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold">Live Chat</span>
        <div className="ml-auto flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs text-muted-foreground">{messages.length}</span>
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
