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
    const { personId, subject, body } = await request.json()

    if (!personId) {
      return NextResponse.json({ error: "Person ID required" }, { status: 400 })
    }

    if (!subject) {
      return NextResponse.json({ error: "Subject required" }, { status: 400 })
    }

    if (!body) {
      return NextResponse.json({ error: "Email body required" }, { status: 400 })
    }

    await client.people
      .person(personId)
      .workflowCards()
      .sendEmail(cardId, subject, body)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to send email:", error)
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    )
  }
}
