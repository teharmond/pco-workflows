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
    // Fetch workflow, steps, and cards
    const [workflow, steps, cards] = await Promise.all([
      client.people.workflow(id).get(),
      client.people.workflow(id).step().list({ order: "sequence", per_page: 100 }),
      client.people.workflow(id).listCards(),
    ])

    // Filter out removed cards and add currentStepId
    const cardsWithDetails = cards.data
      .filter((card: { attributes?: { removed_at?: string | null } }) => !card.attributes?.removed_at)
      .map((card: { id: string; relationships?: { person?: { data?: { type: string; id: string } }; assignee?: { data?: { type: string; id: string } }; current_step?: { data?: { id: string } } } }) => {
        const currentStepId = card.relationships?.current_step?.data?.id

        return {
          ...card,
          person: null, // Will be fetched separately
          assignee: null, // Will be fetched separately
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
