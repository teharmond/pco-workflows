import { NextResponse } from "next/server"
import { getPCOClient } from "@/lib/pco-client"

export async function GET() {
  const client = await getPCOClient()

  if (!client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const response = await client.people.workflow().list()
    return NextResponse.json(response)
  } catch (error) {
    console.error("Failed to fetch workflows:", error)
    return NextResponse.json(
      { error: "Failed to fetch workflows" },
      { status: 500 }
    )
  }
}
