import { NextRequest, NextResponse } from "next/server"
import { getPCOClient } from "@/lib/pco-client"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; cardId: string }> }
) {
  const client = await getPCOClient()
  const { cardId } = await params
  const personId = request.nextUrl.searchParams.get("personId")

  if (!client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!personId) {
    return NextResponse.json({ error: "Person ID required" }, { status: 400 })
  }

  try {
    const response = await client.people
      .person(personId)
      .workflowCards()
      .listActivities(cardId)

    return NextResponse.json(response)
  } catch (error) {
    console.error("Failed to fetch activities:", error)
    return NextResponse.json(
      { error: "Failed to fetch activities" },
      { status: 500 }
    )
  }
}
