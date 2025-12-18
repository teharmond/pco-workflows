"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import type {
  PCOWorkflow,
  PCOWorkflowStep,
  PCOWorkflowCard,
  WorkflowDetailData,
} from "@/lib/types";
import { KanbanColumn } from "./kanban-column";
import { KanbanCard } from "./kanban-card";
import { CardDetailModal } from "./card-detail-modal";
import { ListView } from "./list-view";
import { AddToWorkflowModal } from "./add-to-workflow-modal";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { LayoutGrid, List, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

type ViewMode = "kanban" | "list";

const VIEW_MODE_KEY = "pco-workflow-view-mode";

function getStoredViewMode(): ViewMode {
  if (typeof window === "undefined") return "kanban";
  const stored = localStorage.getItem(VIEW_MODE_KEY);
  return stored === "list" ? "list" : "kanban";
}

function setStoredViewMode(mode: ViewMode) {
  localStorage.setItem(VIEW_MODE_KEY, mode);
}

interface KanbanBoardProps {
  workflowId: string;
}

export function KanbanBoard({ workflowId }: KanbanBoardProps) {
  const [workflow, setWorkflow] = useState<PCOWorkflow | null>(null);
  const [steps, setSteps] = useState<PCOWorkflowStep[]>([]);
  const [cards, setCards] = useState<PCOWorkflowCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCard, setActiveCard] = useState<PCOWorkflowCard | null>(null);
  const [selectedCard, setSelectedCard] = useState<PCOWorkflowCard | null>(
    null
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

  // Load view mode from localStorage on mount
  useEffect(() => {
    setViewMode(getStoredViewMode());
  }, []);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    setStoredViewMode(mode);
    // Auto-select first step when switching to list view
    if (mode === "list" && steps.length > 0 && !selectedStepId) {
      setSelectedStepId(steps[0].id);
    }
  };

  // Set first step when steps load and we're in list view
  useEffect(() => {
    if (viewMode === "list" && steps.length > 0 && !selectedStepId) {
      setSelectedStepId(steps[0].id);
    }
  }, [viewMode, steps, selectedStepId]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`/api/workflows/${workflowId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch workflow");
        }
        const data: WorkflowDetailData = await response.json();
        setWorkflow(data.workflow);
        setSteps(data.steps);
        setCards(data.cards);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [workflowId]);

  const getCardsByStep = useCallback(
    (stepId: string) => {
      return cards.filter((card) => card.currentStepId === stepId);
    },
    [cards]
  );

  const getStepIndex = useCallback(
    (stepId: string) => {
      return steps.findIndex((s) => s.id === stepId);
    },
    [steps]
  );

  const getStepName = useCallback(
    (stepId?: string) => {
      if (!stepId) return undefined;
      const step = steps.find((s) => s.id === stepId);
      return step?.attributes.name;
    },
    [steps]
  );

  const getNextStepName = useCallback(
    (stepId?: string) => {
      if (!stepId) return undefined;
      const currentIndex = steps.findIndex((s) => s.id === stepId);
      if (currentIndex === -1 || currentIndex >= steps.length - 1)
        return undefined;
      return steps[currentIndex + 1]?.attributes.name;
    },
    [steps]
  );

  const isFirstStep = useCallback(
    (stepId?: string) => {
      if (!stepId) return false;
      const currentIndex = steps.findIndex((s) => s.id === stepId);
      return currentIndex === 0;
    },
    [steps]
  );

  const isLastStep = useCallback(
    (stepId?: string) => {
      if (!stepId) return false;
      const currentIndex = steps.findIndex((s) => s.id === stepId);
      return currentIndex === steps.length - 1;
    },
    [steps]
  );

  const refetchData = useCallback(async () => {
    try {
      // Use non-streaming for quick refetch after actions
      const response = await fetch(`/api/workflows/${workflowId}`);
      if (response.ok) {
        const data: WorkflowDetailData = await response.json();
        setWorkflow(data.workflow);
        setSteps(data.steps);
        setCards(data.cards);
      }
    } catch (err) {
      console.error("Failed to refetch data:", err);
    }
  }, [workflowId]);

  const handleCardClick = (card: PCOWorkflowCard) => {
    setSelectedCard(card);
    setModalOpen(true);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const card = cards.find((c) => c.id === active.id);
    if (card) {
      setActiveCard(card);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) return;

    const activeCardId = active.id as string;
    const overStepId = over.id as string;

    const card = cards.find((c) => c.id === activeCardId);
    if (!card || !card.currentStepId) return;

    const currentStepIndex = getStepIndex(card.currentStepId);
    const targetStepIndex = getStepIndex(overStepId);

    if (currentStepIndex === targetStepIndex) return;

    const personId = card.relationships?.person?.data?.id;
    if (!personId) return;

    // Optimistic update
    setCards((prevCards) =>
      prevCards.map((c) =>
        c.id === activeCardId ? { ...c, currentStepId: overStepId } : c
      )
    );

    // Calculate how many promotes or go-backs needed
    const stepsToMove = targetStepIndex - currentStepIndex;

    try {
      if (stepsToMove > 0) {
        // Move forward (promote)
        for (let i = 0; i < stepsToMove; i++) {
          await fetch(
            `/api/workflows/${workflowId}/cards/${activeCardId}/promote`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ personId }),
            }
          );
        }
      } else {
        // Move backward (go back)
        for (let i = 0; i < Math.abs(stepsToMove); i++) {
          await fetch(
            `/api/workflows/${workflowId}/cards/${activeCardId}/go-back`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ personId }),
            }
          );
        }
      }
    } catch (err) {
      console.error("Failed to move card:", err);
      // Revert optimistic update on error
      setCards((prevCards) =>
        prevCards.map((c) =>
          c.id === activeCardId
            ? { ...c, currentStepId: card.currentStepId }
            : c
        )
      );
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-8 bg-muted rounded w-1/4 mb-8 animate-pulse" />
        <div className="flex gap-4 overflow-x-auto">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="min-w-[300px] h-[500px] bg-muted rounded animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="sticky top-0 z-10 bg-background/50 border-b px-4 pr-3 py-2 backdrop-blur-lg">
        <div className="flex items-center justify-between">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/">Workflows</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{workflow?.attributes.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex items-center gap-2">
            <div className="flex  items-center gap-0.5 p-0.5 border ">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleViewModeChange("kanban")}
                className={cn("gap-2", viewMode === "kanban" && "bg-muted")}
              >
                <LayoutGrid className="h-4 w-4" />
                Kanban
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleViewModeChange("list")}
                className={cn("gap-2", viewMode === "list" && "bg-muted")}
              >
                <List className="h-4 w-4" />
                List
              </Button>
            </div>
            <Button
              className="h-8.5 px-3"
              onClick={() => setAddModalOpen(true)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add someone
            </Button>
          </div>
        </div>
      </div>

      <div>
        {viewMode === "kanban" ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 overflow-x-auto pt-4 px-4 pb-4">
              {steps.map((step) => (
                <KanbanColumn
                  key={step.id}
                  step={step}
                  cards={getCardsByStep(step.id)}
                  onCardClick={handleCardClick}
                />
              ))}
            </div>

            <DragOverlay>
              {activeCard ? <KanbanCard card={activeCard} isDragging /> : null}
            </DragOverlay>
          </DndContext>
        ) : (
          <ListView
            steps={steps}
            cards={cards}
            selectedStepId={selectedStepId}
            onSelectStep={setSelectedStepId}
            onCardClick={handleCardClick}
          />
        )}

        <CardDetailModal
          card={selectedCard}
          workflowId={workflowId}
          workflowName={workflow?.attributes.name}
          currentStepId={selectedCard?.currentStepId}
          currentStepName={getStepName(selectedCard?.currentStepId)}
          nextStepName={getNextStepName(selectedCard?.currentStepId)}
          isFirstStep={isFirstStep(selectedCard?.currentStepId)}
          isLastStep={isLastStep(selectedCard?.currentStepId)}
          open={modalOpen}
          onOpenChange={setModalOpen}
          onCardUpdated={refetchData}
        />

        <AddToWorkflowModal
          workflowId={workflowId}
          workflowName={workflow?.attributes.name}
          steps={steps}
          open={addModalOpen}
          onOpenChange={setAddModalOpen}
          onPersonAdded={refetchData}
        />
      </div>
    </div>
  );
}
