import { getAuthStatus } from "@/lib/pco-client"
import { redirect } from "next/navigation"
import { AuthRefresh } from "@/components/auth-refresh"
import { OverdueCardsList } from "@/components/overdue-cards-list"

export default async function OverduePage() {
  const authStatus = await getAuthStatus()

  if (authStatus === "needs_refresh") {
    return <AuthRefresh />
  }

  if (authStatus === "unauthenticated") {
    redirect("/")
  }

  return (
    <main className="min-h-screen px-4">
      <div className="max-w-4xl mx-auto py-6">
        <OverdueCardsList />
      </div>
    </main>
  )
}
