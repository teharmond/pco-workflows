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
    const person = await client.people.person(id).get()
    return NextResponse.json(person.data)
  } catch (error) {
    console.error("Failed to fetch person:", error)
    return NextResponse.json(
      { error: "Failed to fetch person" },
      { status: 500 }
    )
  }
}
