import { NextResponse } from "next/server"
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

interface PCOWorkflow {
  type: string
  id: string
  attributes: {
    name: string
  }
}

interface PCOWorkflowStep {
  type: string
  id: string
  attributes: {
    sequence: number
    name: string
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

export async function GET() {
  const client = await getPCOClient()

  if (!client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Fetch all workflows first
    const workflowsResponse = await client.people.workflow().list()
    const workflows = workflowsResponse.data as PCOWorkflow[]

    // For each workflow, fetch cards with overdue filter and includes
    const overdueCardsByWorkflow: Array<{
      workflow: PCOWorkflow
      steps: PCOWorkflowStep[]
      cards: Array<WorkflowCard & {
        person?: PCOPerson | null
        assignee?: PCOPerson | null
        currentStep?: PCOWorkflowStep | null
      }>
    }> = []

    for (const workflow of workflows) {
      const workflowResource = client.people.workflow(workflow.id)

      // Fetch steps and cards in parallel for this workflow
      const [stepsResponse, cardsResponse] = await Promise.all([
        workflowResource.step().list({ order: "sequence", per_page: 100 }),
        (workflowResource.listCards as (opts: {
          include: string
          where?: { overdue: string }
        }) => Promise<{ data: WorkflowCard[]; included?: unknown[] }>)({
          include: "person,assignee,current_step,workflow",
          where: { overdue: "true" }
        }),
      ])

      const steps = stepsResponse.data as PCOWorkflowStep[]

      // Skip workflows with no overdue cards
      if (!cardsResponse.data || cardsResponse.data.length === 0) {
        continue
      }

      // Build maps for included data
      const peopleMap = new Map<string, PCOPerson>()
      const stepsMap = new Map<string, PCOWorkflowStep>()

      if (cardsResponse.included) {
        for (const item of cardsResponse.included) {
          const typedItem = item as { type: string; id: string }
          if (typedItem.type === "Person") {
            peopleMap.set(typedItem.id, item as PCOPerson)
          } else if (typedItem.type === "WorkflowStep") {
            stepsMap.set(typedItem.id, item as PCOWorkflowStep)
          }
        }
      }

      // Also add steps from the steps response to the map
      for (const step of steps) {
        stepsMap.set(step.id, step)
      }

      // Filter out removed cards and attach person/assignee/step data
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
            currentStep: currentStepId ? stepsMap.get(currentStepId) || null : null,
            currentStepId,
          }
        })

      if (cardsWithDetails.length > 0) {
        overdueCardsByWorkflow.push({
          workflow,
          steps,
          cards: cardsWithDetails,
        })
      }
    }

    return NextResponse.json({ data: overdueCardsByWorkflow })
  } catch (error) {
    console.error("Failed to fetch overdue cards:", error)
    return NextResponse.json(
      { error: "Failed to fetch overdue cards" },
      { status: 500 }
    )
  }
}
