import { NextRequest, NextResponse } from "next/server"
import { getPCOClient } from "@/lib/pco-client"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = await getPCOClient()
  const { id } = await params

  if (!client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const [workflow, steps, cards] = await Promise.all([
      client.people.workflow(id).get(),
      client.people.workflow(id).step().list({ order: "sequence" }),
      client.people.workflow(id).listCards(),
    ])

    // Filter out removed cards and fetch person and assignee details for each card
    const activeCards = cards.data.filter(
      (card: { attributes?: { removed_at?: string | null } }) => !card.attributes?.removed_at
    )

    const cardsWithDetails = await Promise.all(
      activeCards.map(async (card: { id: string; relationships?: { person?: { data?: { id: string } }; assignee?: { data?: { id: string } }; current_step?: { data?: { id: string } } } }) => {
        const personId = card.relationships?.person?.data?.id
        const assigneeId = card.relationships?.assignee?.data?.id
        const currentStepId = card.relationships?.current_step?.data?.id

        const [person, assignee] = await Promise.all([
          personId ? client.people.person(personId).get() : Promise.resolve(null),
          assigneeId ? client.people.person(assigneeId).get() : Promise.resolve(null),
        ])

        return {
          ...card,
          person: person?.data || null,
          assignee: assignee?.data || null,
          currentStepId,
        }
      })
    )

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
