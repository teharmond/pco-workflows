import { NextRequest, NextResponse } from "next/server"
import { getPCOClient } from "@/lib/pco-client"

interface PCOPerson {
  type: string
  id: string
  attributes: {
    first_name: string
    last_name: string
    avatar?: string
  }
}

interface WorkflowStep {
  type: string
  id: string
  attributes: {
    sequence: number
    name: string
    description?: string
    created_at: string
    updated_at: string
  }
}

interface WorkflowCard {
  id: string
  type: string
  attributes: {
    snooze_until?: string
    overdue: boolean
    stage: string
    sticky_assignment: boolean
    created_at: string
    updated_at: string
    completed_at?: string
    removed_at?: string
    moved_to_step_at?: string
  }
  relationships?: {
    assignee?: { data?: { type: string; id: string } }
    person?: { data?: { type: string; id: string } }
    workflow?: { data?: { type: string; id: string } }
    current_step?: { data?: { type: string; id: string } }
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = await getPCOClient()
  const { id } = await params

  if (!client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Fetch workflow, steps, and cards with person/assignee included
    const workflowResource = client.people.workflow(id)
    const [workflowResponse, stepsResponse, cardsResponse] = await Promise.all([
      workflowResource.get(),
      workflowResource.step().list({ order: "sequence", per_page: 100 }),
      (workflowResource.listCards as (opts: { include: string }) => Promise<{ data: WorkflowCard[]; included?: unknown[] }>)({ include: "person,assignee" }),
    ])

    const workflow = workflowResponse.data
    const steps = stepsResponse.data as WorkflowStep[]

    // Debug: log the response structure
    console.log("cardsResponse keys:", Object.keys(cardsResponse))
    console.log("cardsResponse.included:", cardsResponse.included)
    console.log("cardsResponse sample:", JSON.stringify(cardsResponse).slice(0, 500))

    // Build a map of included people for quick lookup
    const peopleMap = new Map<string, PCOPerson>()
    if (cardsResponse.included) {
      for (const item of cardsResponse.included) {
        const typedItem = item as { type: string; id: string }
        if (typedItem.type === "Person") {
          peopleMap.set(typedItem.id, item as PCOPerson)
        }
      }
    }

    // Filter out removed cards and attach person/assignee data
    const cardsWithDetails = cardsResponse.data
      .filter((card) => !card.attributes?.removed_at)
      .map((card) => {
        const currentStepId = card.relationships?.current_step?.data?.id
        const personId = card.relationships?.person?.data?.id
        const assigneeId = card.relationships?.assignee?.data?.id

        return {
          ...card,
          person: personId ? peopleMap.get(personId) || null : null,
          assignee: assigneeId ? peopleMap.get(assigneeId) || null : null,
          currentStepId,
        }
      })

    return NextResponse.json({
      workflow,
      steps,
      cards: cardsWithDetails,
    })
  } catch (error) {
    console.error("Failed to fetch workflow details:", error)
    return NextResponse.json(
      { error: "Failed to fetch workflow details" },
      { status: 500 }
    )
  }
}
