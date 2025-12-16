import { NextRequest, NextResponse } from "next/server"
import { getPCOClient } from "@/lib/pco-client"

export async function GET(request: NextRequest) {
  const client = await getPCOClient()

  if (!client) {
    console.log("[People Search] No client - unauthorized")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("q")

  console.log("[People Search] Query:", query)

  if (!query || query.length < 2) {
    console.log("[People Search] Query too short, returning empty")
    return NextResponse.json({ data: [] })
  }

  try {
    console.log("[People Search] Searching for:", query)
    const response = await client.people.list({
      where: { search_name_or_email: query },
      per_page: 10,
      autoPaginate: false,
    })

    console.log("[People Search] Results count:", response.data?.length || 0)
    console.log("[People Search] Full response:", JSON.stringify(response, null, 2))

    return NextResponse.json(response)
  } catch (error) {
    console.error("[People Search] Failed to search people:", error)
    return NextResponse.json(
      { error: "Failed to search people" },
      { status: 500 }
    )
  }
}
