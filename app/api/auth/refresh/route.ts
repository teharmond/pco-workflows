import { getTokensFromCookies, refreshAccessToken, setTokenCookies } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function POST() {
  const { refreshToken } = await getTokensFromCookies()

  if (!refreshToken) {
    return NextResponse.json({ error: "No refresh token" }, { status: 401 })
  }

  try {
    const tokens = await refreshAccessToken(refreshToken)
    await setTokenCookies(
      tokens.access_token,
      tokens.refresh_token,
      tokens.expires_in
    )
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to refresh token" }, { status: 401 })
  }
}
