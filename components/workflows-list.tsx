"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import type { PCOWorkflow } from "@/lib/types";

export function WorkflowsList() {
  const [workflows, setWorkflows] = useState<PCOWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWorkflows() {
      try {
        const response = await fetch("/api/workflows");
        if (!response.ok) {
          throw new Error("Failed to fetch workflows");
        }
        const data = await response.json();
        setWorkflows(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchWorkflows();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-5 bg-muted rounded w-1/3" />
              <div className="h-4 bg-muted rounded w-1/4 mt-2" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (workflows.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">No workflows found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {workflows.map((workflow) => (
        <Link key={workflow.id} href={`/workflow/${workflow.id}`}>
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer gap-3">
            <CardHeader className="gap-0">
              <CardTitle>{workflow.attributes.name}</CardTitle>
              <CardDescription>
                {workflow.attributes.total_ready_card_count || 0} ready cards
                {workflow.attributes.overdue_card_count
                  ? ` · ${workflow.attributes.overdue_card_count} overdue`
                  : null}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>Total: {workflow.attributes.total_cards_count || 0}</span>
                <span>
                  Completed: {workflow.attributes.completed_card_count || 0}
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
