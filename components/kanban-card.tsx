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
}

export function KanbanCard({ card, isDragging: isDraggingOverlay }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: card.id,
  })

  const personName = card.person
    ? `${card.person.attributes.first_name} ${card.person.attributes.last_name}`
    : "Unknown"

  const assigneeName = card.assignee
    ? `${card.assignee.attributes.first_name} ${card.assignee.attributes.last_name}`
    : "Unassigned"

  return (
    <Card
      ref={setNodeRef}
      size="sm"
      className={cn(
        "cursor-grab active:cursor-grabbing bg-card shadow-sm",
        isDragging && "opacity-0",
        isDraggingOverlay && "shadow-lg rotate-2"
      )}
    >
      <CardHeader className="border-b-0">
        <div className="flex items-start gap-2">
          <button
            {...attributes}
            {...listeners}
            className="mt-0.5 text-muted-foreground hover:text-foreground touch-none"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <div className="flex-1 min-w-0">
            <CardTitle className="truncate">{personName}</CardTitle>
            <CardDescription className="truncate">{card.attributes.stage}</CardDescription>
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
            <span className="truncate">Person: {personName}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <UserCheck className="h-3 w-3" />
            <span className="truncate">Assignee: {assigneeName}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
