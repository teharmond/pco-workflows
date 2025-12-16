"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface LoginButtonProps {
  isLoggedIn: boolean
}

export function LoginButton({ isLoggedIn }: LoginButtonProps) {
  const router = useRouter()

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.refresh()
  }

  if (isLoggedIn) {
    return (
      <Button variant="outline" onClick={handleLogout}>
        Log out
      </Button>
    )
  }

  return (
    <Button asChild>
      <a href="/api/auth/login">Login with Planning Center</a>
    </Button>
  )
}
