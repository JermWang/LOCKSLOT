import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AppLayout } from "@/components/app-layout"
import { AsciiGeometryBackground } from "@/components/ascii-geometry-background"
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'LOCK SLOT | Provably-Fair Pari-Mutuel Staking',
  description: 'Spin. Lock. Win. A provably-fair slot machine where pain funds glory.',
  generator: 'v0.app',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-background text-foreground">
        <AsciiGeometryBackground
          mode="ink"
          resolutionScale={0.5}
          glyphSize={9}
          speed={1}
          sceneScale={1}
          warp={0.75}
          contrast={1.25}
          scanline={0.12}
        />
        <div
          className="fixed inset-0 pointer-events-none bg-background/30"
          style={{ zIndex: -5 }}
        />
        <AppLayout>
          {children}
        </AppLayout>
        <Analytics />
      </body>
    </html>
  )
}
