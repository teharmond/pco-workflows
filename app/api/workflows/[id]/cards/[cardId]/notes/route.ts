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
      .listNotes(cardId)

    return NextResponse.json(response)
  } catch (error) {
    console.error("Failed to fetch notes:", error)
    return NextResponse.json(
      { error: "Failed to fetch notes" },
      { status: 500 }
    )
  }
}

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
    const { personId, note } = await request.json()

    if (!personId) {
      return NextResponse.json({ error: "Person ID required" }, { status: 400 })
    }

    if (!note) {
      return NextResponse.json({ error: "Note content required" }, { status: 400 })
    }

    const response = await client.people
      .person(personId)
      .workflowCards()
      .createNote(cardId, { note })

    return NextResponse.json(response)
  } catch (error) {
    console.error("Failed to create note:", error)
    return NextResponse.json(
      { error: "Failed to create note" },
      { status: 500 }
    )
  }
}
