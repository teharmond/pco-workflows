"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export function AuthRefresh() {
  const router = useRouter()

  useEffect(() => {
    async function refresh() {
      const res = await fetch("/api/auth/refresh", { method: "POST" })
      if (res.ok) {
        router.refresh()
      }
    }
    refresh()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">Refreshing session...</p>
    </div>
  )
}
