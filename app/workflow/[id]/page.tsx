import { getTokensFromCookies } from "@/lib/auth"
import { redirect } from "next/navigation"
import { KanbanBoard } from "@/components/kanban-board"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

interface WorkflowPageProps {
  params: Promise<{ id: string }>
}

export default async function WorkflowPage({ params }: WorkflowPageProps) {
  const { accessToken } = await getTokensFromCookies()
  const { id } = await params

  if (!accessToken) {
    redirect("/")
  }

  return (
    <main className="min-h-screen">
      <div className="border-b p-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to workflows
          </Link>
        </Button>
      </div>
      <KanbanBoard workflowId={id} />
    </main>
  )
}
