"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import type { OverdueWorkflowData, PCOWorkflowCard, PCOWorkflowStep } from "@/lib/types"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CardDetailModal } from "@/components/card-detail-modal"
import { ArrowLeft, User, UserCheck, Clock, ChevronDown, ChevronRight } from "lucide-react"

interface GroupedCards {
  step: PCOWorkflowStep
  cards: PCOWorkflowCard[]
}

export function OverdueCardsList() {
  const [data, setData] = useState<OverdueWorkflowData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedWorkflows, setExpandedWorkflows] = useState<Set<string>>(new Set())
  const [selectedCard, setSelectedCard] = useState<PCOWorkflowCard | null>(null)
  const [selectedWorkflow, setSelectedWorkflow] = useState<OverdueWorkflowData | null>(null)

  useEffect(() => {
    fetchOverdueCards()
  }, [])

  async function fetchOverdueCards() {
    try {
      const response = await fetch("/api/overdue-cards")
      if (!response.ok) {
        throw new Error("Failed to fetch overdue cards")
      }
      const result = await response.json()
      setData(result.data || [])
      // Expand all workflows by default
      const allWorkflowIds = new Set<string>((result.data || []).map((w: OverdueWorkflowData) => w.workflow.id))
      setExpandedWorkflows(allWorkflowIds)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  function toggleWorkflow(workflowId: string) {
    setExpandedWorkflows((prev) => {
      const next = new Set(prev)
      if (next.has(workflowId)) {
        next.delete(workflowId)
      } else {
        next.add(workflowId)
      }
      return next
    })
  }

  function groupCardsByStep(workflowData: OverdueWorkflowData): GroupedCards[] {
    const stepMap = new Map<string, GroupedCards>()

    // Initialize with all steps that have cards
    for (const card of workflowData.cards) {
      const stepId = card.currentStepId || card.relationships?.current_step?.data?.id
      if (!stepId) continue

      if (!stepMap.has(stepId)) {
        const step = workflowData.steps.find((s) => s.id === stepId) ||
          (card as unknown as { currentStep?: PCOWorkflowStep }).currentStep
        if (step) {
          stepMap.set(stepId, { step, cards: [] })
        }
      }

      const group = stepMap.get(stepId)
      if (group) {
        group.cards.push(card)
      }
    }

    // Sort by step sequence
    return Array.from(stepMap.values()).sort(
      (a, b) => a.step.attributes.sequence - b.step.attributes.sequence
    )
  }

  function getStepInfo(card: PCOWorkflowCard, workflowData: OverdueWorkflowData) {
    const stepId = card.currentStepId || card.relationships?.current_step?.data?.id
    const currentStepIndex = workflowData.steps.findIndex((s) => s.id === stepId)
    const currentStep = workflowData.steps[currentStepIndex]
    const nextStep = workflowData.steps[currentStepIndex + 1]

    return {
      currentStepId: stepId,
      currentStepName: currentStep?.attributes.name || card.attributes.stage,
      nextStepName: nextStep?.attributes.name,
      isFirstStep: currentStepIndex === 0,
      isLastStep: currentStepIndex === workflowData.steps.length - 1,
    }
  }

  const totalOverdueCards = data.reduce((acc, w) => acc + w.cards.length, 0)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-10 w-24 bg-muted animate-pulse rounded" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg p-4 space-y-4">
            <div className="h-6 w-64 bg-muted animate-pulse rounded" />
            <div className="space-y-2">
              {[1, 2].map((j) => (
                <div key={j} className="h-20 bg-muted animate-pulse rounded" />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="font-semibold tracking-tight">Overdue Cards</h1>
        </div>
        <div className="text-center py-12 text-destructive">
          <p>{error}</p>
          <Button onClick={fetchOverdueCards} variant="outline" className="mt-4">
            Try again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="font-semibold tracking-tight flex items-center gap-2">
              Overdue Cards
              <Badge variant="destructive">{totalOverdueCards}</Badge>
            </h1>
          </div>
        </div>

        {data.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No overdue cards</p>
            <p className="text-sm">All your workflow cards are on track!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((workflowData) => {
              const isExpanded = expandedWorkflows.has(workflowData.workflow.id)
              const groupedCards = groupCardsByStep(workflowData)

              return (
                <div key={workflowData.workflow.id} className="border rounded-lg">
                  <button
                    onClick={() => toggleWorkflow(workflowData.workflow.id)}
                    className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="font-medium">
                        {workflowData.workflow.attributes.name}
                      </span>
                      <Badge variant="destructive" className="text-xs">
                        {workflowData.cards.length} overdue
                      </Badge>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t px-4 pb-4 space-y-4">
                      {groupedCards.map(({ step, cards }) => (
                        <div key={step.id} className="mt-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="h-px flex-1 bg-border" />
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-2">
                              {step.attributes.name}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {cards.length}
                            </Badge>
                            <div className="h-px flex-1 bg-border" />
                          </div>

                          <div className="grid gap-2">
                            {cards.map((card) => {
                              const personName = card.person
                                ? `${card.person.attributes.first_name} ${card.person.attributes.last_name}`
                                : "Unknown"
                              const assigneeName = card.assignee
                                ? `${card.assignee.attributes.first_name} ${card.assignee.attributes.last_name}`
                                : "Unassigned"

                              return (
                                <Card
                                  key={card.id}
                                  size="sm"
                                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                                  onClick={() => {
                                    setSelectedCard(card)
                                    setSelectedWorkflow(workflowData)
                                  }}
                                >
                                  <CardHeader className="border-b-0">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1 min-w-0">
                                        <CardTitle className="truncate">
                                          {personName}
                                        </CardTitle>
                                        <CardDescription className="truncate">
                                          {card.attributes.stage}
                                        </CardDescription>
                                      </div>
                                      <Badge variant="destructive" className="shrink-0">
                                        Overdue
                                      </Badge>
                                    </div>
                                  </CardHeader>
                                  <CardContent className="pt-0">
                                    <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                                      <div className="flex items-center gap-1.5">
                                        <User className="h-3 w-3" />
                                        <span className="truncate">{personName}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <UserCheck className="h-3 w-3" />
                                        <span className="truncate">{assigneeName}</span>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {selectedCard && selectedWorkflow && (
        <CardDetailModal
          card={selectedCard}
          workflowId={selectedWorkflow.workflow.id}
          workflowName={selectedWorkflow.workflow.attributes.name}
          {...getStepInfo(selectedCard, selectedWorkflow)}
          open={!!selectedCard}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedCard(null)
              setSelectedWorkflow(null)
            }
          }}
          onCardUpdated={() => {
            fetchOverdueCards()
            setSelectedCard(null)
            setSelectedWorkflow(null)
          }}
        />
      )}
    </>
  )
}
