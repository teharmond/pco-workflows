"use client"

import { useDraggable } from "@dnd-kit/core"
import type { PCOWorkflowCard } from "@/lib/types"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { GripVertical, User, UserCheck } from "lucide-react"

interface KanbanCardProps {
  card: PCOWorkflowCard
  isDragging?: boolean
  onClick?: () => void
}

export function KanbanCard({ card, isDragging: isDraggingOverlay, onClick }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: card.id,
  })

  const isLoading = !card.person
  const personName = card.person
    ? `${card.person.attributes.first_name} ${card.person.attributes.last_name}`
    : null

  const assigneeName = card.assignee
    ? `${card.assignee.attributes.first_name} ${card.assignee.attributes.last_name}`
    : "Unassigned"

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger click if we're dragging
    if (isDragging) return
    // Don't trigger if clicking the drag handle
    if ((e.target as HTMLElement).closest('[data-drag-handle]')) return
    onClick?.()
  }

  return (
    <Card
      ref={setNodeRef}
      size="sm"
      onClick={handleCardClick}
      className={cn(
        "bg-card shadow-sm",
        isDragging && "opacity-0",
        isDraggingOverlay && "shadow-lg rotate-2",
        onClick && "cursor-pointer hover:bg-muted/50 transition-colors"
      )}
    >
      <CardHeader className="border-b-0">
        <div className="flex items-start gap-2">
          <button
            data-drag-handle
            {...attributes}
            {...listeners}
            className="mt-0.5 text-muted-foreground hover:text-foreground touch-none cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <>
                <div className="h-4 bg-muted rounded w-24 animate-pulse mb-1" />
                <div className="h-3 bg-muted rounded w-16 animate-pulse" />
              </>
            ) : (
              <>
                <CardTitle className="truncate">{personName}</CardTitle>
                <CardDescription className="truncate">{card.attributes.stage}</CardDescription>
              </>
            )}
          </div>
          {card.attributes.overdue && (
            <Badge variant="destructive" className="shrink-0">
              Overdue
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <User className="h-3 w-3" />
            {isLoading ? (
              <div className="h-3 bg-muted rounded w-20 animate-pulse" />
            ) : (
              <span className="truncate">{personName}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <UserCheck className="h-3 w-3" />
            {isLoading ? (
              <div className="h-3 bg-muted rounded w-16 animate-pulse" />
            ) : (
              <span className="truncate">{assigneeName}</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
