import { NextRequest, NextResponse } from "next/server"
import { exchangeCodeForTokens, setTokenCookies } from "@/lib/auth"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")

  if (!code) {
    return NextResponse.redirect(new URL("/?error=no_code", request.url))
  }

  try {
    const tokens = await exchangeCodeForTokens(code)

    await setTokenCookies(
      tokens.access_token,
      tokens.refresh_token,
      tokens.expires_in
    )

    return NextResponse.redirect(new URL("/", request.url))
  } catch {
    return NextResponse.redirect(new URL("/?error=auth_failed", request.url))
  }
}
