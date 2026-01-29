'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner, ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: 'bg-[#081420]/80 backdrop-blur-xl border border-[#1a3a4a]/50 shadow-xl shadow-black/20',
          title: 'text-[#e8f4f8] font-semibold',
          description: 'text-[#6b8a9a]',
          success: 'bg-[#081420]/80 backdrop-blur-xl border-[#00d4aa]/30',
          error: 'bg-[#081420]/80 backdrop-blur-xl border-red-500/30',
          info: 'bg-[#081420]/80 backdrop-blur-xl border-[#00b4d8]/30',
        },
      }}
      style={
        {
          '--normal-bg': 'rgba(8, 20, 32, 0.8)',
          '--normal-text': '#e8f4f8',
          '--normal-border': 'rgba(26, 58, 74, 0.5)',
          '--success-bg': 'rgba(8, 20, 32, 0.8)',
          '--success-text': '#00d4aa',
          '--success-border': 'rgba(0, 212, 170, 0.3)',
          '--error-bg': 'rgba(8, 20, 32, 0.8)',
          '--error-text': '#ef4444',
          '--error-border': 'rgba(239, 68, 68, 0.3)',
          '--info-bg': 'rgba(8, 20, 32, 0.8)',
          '--info-text': '#00b4d8',
          '--info-border': 'rgba(0, 180, 216, 0.3)',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
