"use client"

import { Skeleton } from "@/components/ui/skeleton"

export function SlotMachineSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Reels skeleton */}
      <div className="flex justify-center gap-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="w-24 h-32 rounded-xl" />
        ))}
      </div>
      
      {/* Stake input skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
      
      {/* Button skeleton */}
      <Skeleton className="h-14 w-full rounded-xl" />
    </div>
  )
}

export function LiveFeedSkeleton() {
  return (
    <div className="h-full flex flex-col glass-panel rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Skeleton className="h-2 w-2 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-4 w-16" />
      </div>
      
      {/* Feed items */}
      <div className="flex-1 p-3 space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-5 w-10" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function LiveChatSkeleton() {
  return (
    <div className="flex flex-col h-full glass-panel rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b border-border">
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-4 w-16" />
      </div>
      
      {/* Messages */}
      <div className="flex-1 p-3 space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-2 w-10" />
            </div>
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
      
      {/* Input */}
      <div className="p-2 border-t border-border">
        <Skeleton className="h-8 w-full rounded-lg" />
      </div>
    </div>
  )
}

export function RewardPoolSkeleton() {
  return (
    <div className="glow-border">
      <div className="relative overflow-hidden rounded-[14px] glass-panel p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="space-y-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-2 w-32" />
            </div>
          </div>
          <Skeleton className="h-4 w-12" />
        </div>
        
        {/* Main value */}
        <div className="mb-4">
          <Skeleton className="h-12 w-48" />
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-primary/20">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center space-y-1">
              <Skeleton className="h-3 w-16 mx-auto" />
              <Skeleton className="h-5 w-12 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function BalanceSkeleton() {
  return (
    <div className="flex items-center gap-2">
      <Skeleton className="h-5 w-5 rounded" />
      <Skeleton className="h-5 w-20" />
    </div>
  )
}

export function ActiveLocksSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2].map((i) => (
        <div key={i} className="p-4 rounded-xl bg-secondary/30 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
          <div className="flex justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}
