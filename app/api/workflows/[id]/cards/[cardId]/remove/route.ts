import { NextRequest, NextResponse } from "next/server"
import { getPCOClient } from "@/lib/pco-client"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; cardId: string }> }
) {
  const client = await getPCOClient()
  const { cardId } = await params

  if (!client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { personId } = await request.json()

    if (!personId) {
      return NextResponse.json({ error: "Person ID required" }, { status: 400 })
    }

    await client.people.person(personId).workflowCards().remove(cardId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to remove card:", error)
    return NextResponse.json(
      { error: "Failed to remove card" },
      { status: 500 }
    )
  }
}
