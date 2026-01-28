"use client"

import { useState, useEffect, useCallback } from "react"
import { useWallet } from "@/lib/wallet-context"
import { signAuth } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { User, Check, AlertCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { gameSounds } from "@/lib/sounds"

interface UsernameModalProps {
  onUsernameSet?: (username: string) => void
}

export function UsernameModal({ onUsernameSet }: UsernameModalProps) {
  const { connected, publicKey } = useWallet()
  const [open, setOpen] = useState(false)
  const [username, setUsername] = useState("")
  const [currentUsername, setCurrentUsername] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const fetchUsername = useCallback(async () => {
    if (!publicKey) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/username?wallet=${publicKey}`)
      const data = await res.json()
      if (data.username) {
        setCurrentUsername(data.username)
        setUsername(data.username)
      }
    } catch (err) {
      console.error("Failed to fetch username:", err)
    } finally {
      setIsLoading(false)
    }
  }, [publicKey])

  // Fetch current username when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      fetchUsername()
    } else {
      setCurrentUsername(null)
      setUsername("")
    }
  }, [connected, publicKey, fetchUsername])

  const handleSave = async () => {
    if (!publicKey || !username.trim()) return
    
    setIsSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const cleanUsername = username.trim()
      const auth = await signAuth({
        action: "set_username",
        walletAddress: publicKey,
        payload: { username: cleanUsername },
      })

      const res = await fetch("/api/username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: publicKey, username: cleanUsername, auth }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to save username")
        gameSounds.error()
        return
      }

      setCurrentUsername(data.username)
      setSuccess(true)
      gameSounds.success()
      onUsernameSet?.(data.username)
      
      setTimeout(() => {
        setOpen(false)
        setSuccess(false)
      }, 1500)
    } catch (err) {
      setError("Failed to save username")
      gameSounds.error()
    } finally {
      setIsSaving(false)
    }
  }

  const isValid = username.trim().length >= 3 && 
                  username.trim().length <= 20 && 
                  /^[a-zA-Z0-9_]+$/.test(username.trim())

  if (!connected) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <User className="h-4 w-4" />
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : currentUsername ? (
            <span className="font-semibold">{currentUsername}</span>
          ) : (
            <span className="text-muted-foreground">Set Username</span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            {currentUsername ? "Change Username" : "Set Your Username"}
          </DialogTitle>
          <DialogDescription>
            Choose a display name for the live feed. Others will see this instead of your wallet address.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Input */}
          <div className="space-y-2">
            <Input
              placeholder="Enter username..."
              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
                setError(null)
                setSuccess(false)
              }}
              maxLength={20}
              className={cn(
                "font-mono text-lg",
                error && "border-destructive",
                success && "border-primary"
              )}
            />
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                3-20 characters, letters, numbers, underscores only
              </span>
              <span className={cn(
                "font-mono",
                username.length < 3 ? "text-muted-foreground" : 
                username.length > 20 ? "text-destructive" : "text-primary"
              )}>
                {username.length}/20
              </span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="flex items-center gap-2 text-sm text-primary">
              <Check className="h-4 w-4" />
              Username saved!
            </div>
          )}

          {/* Preview */}
          <div className="rounded-lg border border-border bg-secondary/30 p-3">
            <div className="text-xs text-muted-foreground mb-1">Preview in feed:</div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <span className="font-semibold">
                {username.trim() || publicKey?.slice(0, 4) + "..." + publicKey?.slice(-4)}
              </span>
              <span className="text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                MYTHIC
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!isValid || isSaving}
            className="gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Save Username
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
