import { NextRequest, NextResponse } from "next/server"
import { getPCOClient } from "@/lib/pco-client"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = await getPCOClient()
  const { id: workflowId } = await params

  if (!client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { personId, targetStepIndex } = await request.json()

    if (!personId) {
      return NextResponse.json({ error: "Person ID required" }, { status: 400 })
    }

    // Create the workflow card (adds to step 1)
    const createResponse = await client.people.workflow(workflowId).createCard({
      person_id: personId,
    })

    const cardId = createResponse.data?.id

    // If target step is beyond step 1, promote the card the appropriate number of times
    if (cardId && targetStepIndex > 0) {
      for (let i = 0; i < targetStepIndex; i++) {
        await client.people.person(personId).workflowCards().promote(cardId)
      }
    }

    return NextResponse.json({ success: true, cardId })
  } catch (error) {
    console.error("Failed to add person to workflow:", error)
    return NextResponse.json(
      { error: "Failed to add person to workflow" },
      { status: 500 }
    )
  }
}
