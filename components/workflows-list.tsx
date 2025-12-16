"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { PCOWorkflow, PCOWorkflowCategory } from "@/lib/types";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PinTack } from "./icons";

const PINNED_WORKFLOWS_KEY = "pco-pinned-workflows";

function getPinnedWorkflows(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(PINNED_WORKFLOWS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function setPinnedWorkflows(ids: string[]) {
  localStorage.setItem(PINNED_WORKFLOWS_KEY, JSON.stringify(ids));
}

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="bg-muted text-muted-foreground px-1.5 py-0.5 rounded text-xs font-medium min-w-[20px] text-center">
        {value}
      </span>
    </div>
  );
}

export function WorkflowsList() {
  const [workflows, setWorkflows] = useState<PCOWorkflow[]>([]);
  const [categories, setCategories] = useState<PCOWorkflowCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);

  useEffect(() => {
    setPinnedIds(getPinnedWorkflows());
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const [workflowsRes, categoriesRes] = await Promise.all([
          fetch("/api/workflows"),
          fetch("/api/workflow-categories"),
        ]);

        if (!workflowsRes.ok) {
          throw new Error("Failed to fetch workflows");
        }

        const workflowsData = await workflowsRes.json();
        const categoriesData = categoriesRes.ok
          ? await categoriesRes.json()
          : { data: [] };

        const fetchedWorkflows = workflowsData.data || [];
        setWorkflows(fetchedWorkflows);
        setCategories(categoriesData.data || []);

        // Clean up pinned workflows that no longer exist
        const existingIds = new Set(
          fetchedWorkflows.map((w: PCOWorkflow) => w.id)
        );
        const storedPinned = getPinnedWorkflows();
        const validPinned = storedPinned.filter((id) => existingIds.has(id));
        if (validPinned.length !== storedPinned.length) {
          setPinnedWorkflows(validPinned);
          setPinnedIds(validPinned);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const togglePin = (workflowId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const newPinned = pinnedIds.includes(workflowId)
      ? pinnedIds.filter((id) => id !== workflowId)
      : [...pinnedIds, workflowId];

    setPinnedIds(newPinned);
    setPinnedWorkflows(newPinned);
  };

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return null;
    const category = categories.find((c) => c.id === categoryId);
    return category?.attributes.name || null;
  };

  const { pinnedWorkflows, unpinnedWorkflows } = useMemo(() => {
    const pinned: PCOWorkflow[] = [];
    const unpinned: PCOWorkflow[] = [];

    workflows.forEach((workflow) => {
      if (pinnedIds.includes(workflow.id)) {
        pinned.push(workflow);
      } else {
        unpinned.push(workflow);
      }
    });

    pinned.sort((a, b) => pinnedIds.indexOf(a.id) - pinnedIds.indexOf(b.id));

    return { pinnedWorkflows: pinned, unpinnedWorkflows: unpinned };
  }, [workflows, pinnedIds]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse p-4">
            <div className="h-5 bg-muted rounded w-1/3 mb-3" />
            <div className="h-4 bg-muted rounded w-1/2" />
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

  const WorkflowRow = ({
    workflow,
    isPinned,
  }: {
    workflow: PCOWorkflow;
    isPinned: boolean;
  }) => {
    const myCards = workflow.attributes.my_ready_card_count || 0;
    const readyCount = workflow.attributes.total_ready_card_count || 0;
    const categoryName = getCategoryName(workflow.attributes.category_id);

    return (
      <Link href={`/workflow/${workflow.id}`} className="block">
        <Card className="p-4 hover:bg-muted/30 transition-colors group">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-base mb-2">
                {workflow.attributes.name}
              </h3>
              <div className="flex items-center gap-4 text-sm flex-wrap">
                <StatItem label="My cards" value={myCards} />
                <StatItem label="Ready cards" value={readyCount} />
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {categoryName && (
                <Badge
                  variant="outline"
                  className="text-blue-600 border-blue-200 bg-blue-50"
                >
                  {categoryName}
                </Badge>
              )}
              <Button
                variant="outline"
                size="icon-sm"
                onClick={(e) => togglePin(workflow.id, e)}
                className={isPinned ? "bg-primary/5 hover:bg-primary/10" : ""}
              >
                <PinTack className={`h-4 w-4 ${isPinned ? "rotate-45" : ""}`} />
              </Button>
            </div>
          </div>
        </Card>
      </Link>
    );
  };

  return (
    <div className="space-y-4">
      {pinnedWorkflows.length > 0 && (
        <div className="space-y-3">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Pinned
          </div>
          {pinnedWorkflows.map((workflow) => (
            <WorkflowRow key={workflow.id} workflow={workflow} isPinned />
          ))}
        </div>
      )}

      {unpinnedWorkflows.length > 0 && (
        <div className="space-y-3">
          {pinnedWorkflows.length > 0 && (
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mt-6">
              All workflows
            </div>
          )}
          {unpinnedWorkflows.map((workflow) => (
            <WorkflowRow
              key={workflow.id}
              workflow={workflow}
              isPinned={false}
            />
          ))}
        </div>
      )}

      {workflows.length === 0 && (
        <div className="text-center py-10">
          <p className="text-muted-foreground">No workflows found</p>
        </div>
      )}
    </div>
  );
}
