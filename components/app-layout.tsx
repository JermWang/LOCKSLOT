"use client"

import React, { useEffect } from "react"

import { WalletProvider } from "@/lib/wallet-context"
import { useWallet } from "@/lib/wallet-context"
import { useGameStore } from "@/lib/game-store"
import { Navbar } from "@/components/navbar"
import { AppSidebar } from "@/components/app-sidebar"
import { Footer } from "@/components/footer"
import { Toaster } from "@/components/ui/sonner"

function WalletStoreSync() {
  const { publicKey } = useWallet()
  const setWallet = useGameStore((s) => s.setWallet)
  const fetchUserData = useGameStore((s) => s.fetchUserData)

  useEffect(() => {
    if (publicKey) {
      setWallet(publicKey)
      fetchUserData(publicKey)
    } else {
      setWallet(null)
    }
  }, [publicKey, setWallet, fetchUserData])

  return null
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <WalletProvider>
      <WalletStoreSync />
      <Navbar />
      <AppSidebar />
      <main className="min-h-screen pt-16 lg:pl-56 flex flex-col">
        <div className="flex-1">
          {children}
        </div>
        <div className="lg:pl-0">
          <Footer />
        </div>
      </main>
      <Toaster position="bottom-right" closeButton />
    </WalletProvider>
  )
}
