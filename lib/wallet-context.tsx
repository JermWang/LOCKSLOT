"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from "react"

interface WalletContextType {
  connected: boolean
  publicKey: string | null
  connecting: boolean
  connect: () => Promise<void>
  disconnect: () => void
  walletName: string | null
}

const WalletContext = createContext<WalletContextType>({
  connected: false,
  publicKey: null,
  connecting: false,
  connect: async () => {},
  disconnect: () => {},
  walletName: null,
})

export function useWallet() {
  return useContext(WalletContext)
}

declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean
      connect: () => Promise<{ publicKey: { toString: () => string } }>
      disconnect: () => Promise<void>
      on: (event: string, callback: () => void) => void
      publicKey?: { toString: () => string }
      isConnected?: boolean
    }
    solflare?: {
      isSolflare?: boolean
      connect: () => Promise<{ publicKey: { toString: () => string } }>
      disconnect: () => Promise<void>
      on: (event: string, callback: () => void) => void
      publicKey?: { toString: () => string }
      isConnected?: boolean
    }
  }
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(false)
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [walletName, setWalletName] = useState<string | null>(null)

  // Check for existing connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window === "undefined") return
      
      // Check Phantom
      if (window.solana?.isPhantom && window.solana.isConnected && window.solana.publicKey) {
        setConnected(true)
        setPublicKey(window.solana.publicKey.toString())
        setWalletName("Phantom")
      }
      // Check Solflare
      else if (window.solflare?.isSolflare && window.solflare.isConnected && window.solflare.publicKey) {
        setConnected(true)
        setPublicKey(window.solflare.publicKey.toString())
        setWalletName("Solflare")
      }
    }
    
    checkConnection()
  }, [])

  const connect = useCallback(async () => {
    if (typeof window === "undefined") return
    setConnecting(true)

    try {
      // Try Phantom first
      if (window.solana?.isPhantom) {
        const response = await window.solana.connect()
        setConnected(true)
        setPublicKey(response.publicKey.toString())
        setWalletName("Phantom")
        
        window.solana.on("disconnect", () => {
          setConnected(false)
          setPublicKey(null)
          setWalletName(null)
        })
      }
      // Try Solflare
      else if (window.solflare?.isSolflare) {
        const response = await window.solflare.connect()
        setConnected(true)
        setPublicKey(response.publicKey.toString())
        setWalletName("Solflare")
        
        window.solflare.on("disconnect", () => {
          setConnected(false)
          setPublicKey(null)
          setWalletName(null)
        })
      }
      // No wallet found
      else {
        window.open("https://phantom.app/", "_blank")
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error)
    } finally {
      setConnecting(false)
    }
  }, [])

  const disconnect = useCallback(async () => {
    if (typeof window === "undefined") return

    try {
      if (window.solana?.isPhantom) {
        await window.solana.disconnect()
      } else if (window.solflare?.isSolflare) {
        await window.solflare.disconnect()
      }
    } catch (error) {
      console.error("Failed to disconnect:", error)
    }

    setConnected(false)
    setPublicKey(null)
    setWalletName(null)
  }, [])

  return (
    <WalletContext.Provider
      value={{
        connected,
        publicKey,
        connecting,
        connect,
        disconnect,
        walletName,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}
