"use client";

import { useDroppable } from "@dnd-kit/core";
import type { PCOWorkflowStep, PCOWorkflowCard } from "@/lib/types";
import { KanbanCard } from "./kanban-card";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
  step: PCOWorkflowStep;
  cards: PCOWorkflowCard[];
  onCardClick?: (card: PCOWorkflowCard) => void;
  isLoading?: boolean;
}

function LoadingCard() {
  return (
    <div className="bg-background border p-3 animate-pulse">
      <div className="flex items-center gap-2 mb-2">
        <div className="size-8 rounded-full bg-muted" />
        <div className="h-4 bg-muted rounded w-24" />
      </div>
      <div className="h-3 bg-muted rounded w-16" />
    </div>
  );
}

export function KanbanColumn({ step, cards, onCardClick, isLoading }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: step.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-w-[300px] w-[300px] bg-muted/50  p-4 flex flex-col",
        isOver && "ring-2 ring-primary"
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">{step.attributes.name}</h3>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
          {isLoading ? "..." : cards.length}
        </span>
      </div>

      <div className="flex flex-col gap-2 flex-1 min-h-[200px]">
        {cards.map((card) => (
          <KanbanCard
            key={card.id}
            card={card}
            onClick={() => onCardClick?.(card)}
          />
        ))}

        {isLoading && <LoadingCard />}

        {!isLoading && cards.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
            No cards
          </div>
        )}
      </div>
    </div>
  );
}
