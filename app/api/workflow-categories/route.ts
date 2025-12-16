import { NextResponse } from "next/server"
import { getPCOClient } from "@/lib/pco-client"

export async function GET() {
  const client = await getPCOClient()

  if (!client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const response = await client.request("GET", "/people/v2/workflow_categories")
    return NextResponse.json(response)
  } catch (error) {
    console.error("Failed to fetch workflow categories:", error)
    return NextResponse.json(
      { error: "Failed to fetch workflow categories" },
      { status: 500 }
    )
  }
}
