import { cookies } from "next/headers"

const PCO_AUTH_URL = "https://api.planningcenteronline.com/oauth/authorize"
const PCO_TOKEN_URL = "https://api.planningcenteronline.com/oauth/token"

export function getAuthUrl() {
  const clientId = process.env.PCO_CLIENT_ID!
  const redirectUri = process.env.PCO_REDIRECT_URI!

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "people",
  })

  return `${PCO_AUTH_URL}?${params.toString()}`
}

export async function exchangeCodeForTokens(code: string) {
  const response = await fetch(PCO_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      client_id: process.env.PCO_CLIENT_ID!,
      client_secret: process.env.PCO_SECRET!,
      redirect_uri: process.env.PCO_REDIRECT_URI!,
    }),
  })

  if (!response.ok) {
    throw new Error("Failed to exchange code for tokens")
  }

  return response.json()
}

export async function refreshAccessToken(refreshToken: string) {
  const response = await fetch(PCO_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: process.env.PCO_CLIENT_ID!,
      client_secret: process.env.PCO_SECRET!,
    }),
  })

  if (!response.ok) {
    throw new Error("Failed to refresh token")
  }

  return response.json()
}

export async function getTokensFromCookies() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get("pco_access_token")?.value
  const refreshToken = cookieStore.get("pco_refresh_token")?.value
  const expiresAt = cookieStore.get("pco_expires_at")?.value

  return { accessToken, refreshToken, expiresAt }
}

export async function setTokenCookies(
  accessToken: string,
  refreshToken: string,
  expiresIn: number
) {
  const cookieStore = await cookies()
  const expiresAt = Date.now() + expiresIn * 1000

  cookieStore.set("pco_access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: expiresIn,
  })

  cookieStore.set("pco_refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })

  cookieStore.set("pco_expires_at", expiresAt.toString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: expiresIn,
  })
}

export async function clearTokenCookies() {
  const cookieStore = await cookies()
  cookieStore.delete("pco_access_token")
  cookieStore.delete("pco_refresh_token")
  cookieStore.delete("pco_expires_at")
}
