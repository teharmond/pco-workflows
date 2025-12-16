"use client"

import { useEffect, useState, useCallback } from "react"
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
} from "@dnd-kit/core"
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import type { PCOWorkflow, PCOWorkflowStep, PCOWorkflowCard, WorkflowDetailData } from "@/lib/types"
import { KanbanColumn } from "./kanban-column"
import { KanbanCard } from "./kanban-card"

interface KanbanBoardProps {
  workflowId: string
}

export function KanbanBoard({ workflowId }: KanbanBoardProps) {
  const [workflow, setWorkflow] = useState<PCOWorkflow | null>(null)
  const [steps, setSteps] = useState<PCOWorkflowStep[]>([])
  const [cards, setCards] = useState<PCOWorkflowCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeCard, setActiveCard] = useState<PCOWorkflowCard | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`/api/workflows/${workflowId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch workflow")
        }
        const data: WorkflowDetailData = await response.json()
        setWorkflow(data.workflow)
        setSteps(data.steps)
        setCards(data.cards)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [workflowId])

  const getCardsByStep = useCallback(
    (stepId: string) => {
      return cards.filter((card) => card.currentStepId === stepId)
    },
    [cards]
  )

  const getStepIndex = useCallback(
    (stepId: string) => {
      return steps.findIndex((s) => s.id === stepId)
    },
    [steps]
  )

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const card = cards.find((c) => c.id === active.id)
    if (card) {
      setActiveCard(card)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveCard(null)

    if (!over) return

    const activeCardId = active.id as string
    const overStepId = over.id as string

    const card = cards.find((c) => c.id === activeCardId)
    if (!card || !card.currentStepId) return

    const currentStepIndex = getStepIndex(card.currentStepId)
    const targetStepIndex = getStepIndex(overStepId)

    if (currentStepIndex === targetStepIndex) return

    const personId = card.relationships?.person?.data?.id
    if (!personId) return

    // Optimistic update
    setCards((prevCards) =>
      prevCards.map((c) =>
        c.id === activeCardId ? { ...c, currentStepId: overStepId } : c
      )
    )

    // Calculate how many promotes or go-backs needed
    const stepsToMove = targetStepIndex - currentStepIndex

    try {
      if (stepsToMove > 0) {
        // Move forward (promote)
        for (let i = 0; i < stepsToMove; i++) {
          await fetch(`/api/workflows/${workflowId}/cards/${activeCardId}/promote`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ personId }),
          })
        }
      } else {
        // Move backward (go back)
        for (let i = 0; i < Math.abs(stepsToMove); i++) {
          await fetch(`/api/workflows/${workflowId}/cards/${activeCardId}/go-back`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ personId }),
          })
        }
      }
    } catch (err) {
      console.error("Failed to move card:", err)
      // Revert optimistic update on error
      setCards((prevCards) =>
        prevCards.map((c) =>
          c.id === activeCardId ? { ...c, currentStepId: card.currentStepId } : c
        )
      )
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-8 bg-muted rounded w-1/4 mb-8 animate-pulse" />
        <div className="flex gap-4 overflow-x-auto">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="min-w-[300px] h-[500px] bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-8">{workflow?.attributes.name}</h1>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {steps.map((step) => (
            <KanbanColumn
              key={step.id}
              step={step}
              cards={getCardsByStep(step.id)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeCard ? <KanbanCard card={activeCard} isDragging /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
