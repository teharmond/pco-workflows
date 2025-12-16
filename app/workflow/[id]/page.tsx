import { getAuthStatus } from "@/lib/pco-client";
import { redirect } from "next/navigation";
import { KanbanBoard } from "@/components/kanban-board";
import { AuthRefresh } from "@/components/auth-refresh";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface WorkflowPageProps {
  params: Promise<{ id: string }>;
}

export default async function WorkflowPage({ params }: WorkflowPageProps) {
  const authStatus = await getAuthStatus();
  const { id } = await params;

  if (authStatus === "needs_refresh") {
    return <AuthRefresh />;
  }

  if (authStatus === "unauthenticated") {
    redirect("/");
  }

  return (
    <main className="min-h-screen">
      <KanbanBoard workflowId={id} />
    </main>
  );
}
