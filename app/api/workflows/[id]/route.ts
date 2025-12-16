import { NextRequest, NextResponse } from "next/server"
import { getPCOClient } from "@/lib/pco-client"

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
    // Fetch workflow, steps, and cards with included person/assignee data
    const [workflow, steps, cards] = await Promise.all([
      client.people.workflow(id).get(),
      client.people.workflow(id).step().list({ order: "sequence", per_page: 100 }),
      client.people.workflow(id).listCards(),
    ])

    // Build a map of included resources by type and id (if present)
    const includedMap = new Map<string, unknown>()
    const cardsResponse = cards as { data: unknown[]; included?: Array<{ type: string; id: string }> }
    if (cardsResponse.included) {
      for (const item of cardsResponse.included) {
        includedMap.set(`${item.type}:${item.id}`, item)
      }
    }

    // Filter out removed cards and map with included data
    const cardsWithDetails = cards.data
      .filter((card: { attributes?: { removed_at?: string | null } }) => !card.attributes?.removed_at)
      .map((card: { id: string; relationships?: { person?: { data?: { type: string; id: string } }; assignee?: { data?: { type: string; id: string } }; current_step?: { data?: { id: string } } } }) => {
        const personRef = card.relationships?.person?.data
        const assigneeRef = card.relationships?.assignee?.data
        const currentStepId = card.relationships?.current_step?.data?.id

        return {
          ...card,
          // Use included data if available, otherwise null (will be fetched when modal opens)
          person: personRef && includedMap.has(`${personRef.type}:${personRef.id}`)
            ? includedMap.get(`${personRef.type}:${personRef.id}`)
            : null,
          assignee: assigneeRef && includedMap.has(`${assigneeRef.type}:${assigneeRef.id}`)
            ? includedMap.get(`${assigneeRef.type}:${assigneeRef.id}`)
            : null,
          currentStepId,
        }
      })

    return NextResponse.json({
      workflow: workflow.data,
      steps: steps.data,
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
