import { PlanningCenter } from "planning-center-api"
import { getTokensFromCookies } from "./auth"

export async function getPCOClient() {
  const { accessToken } = await getTokensFromCookies()

  if (!accessToken) {
    return null
  }

  return new PlanningCenter({
    auth: {
      type: "bearer",
      bearerToken: accessToken,
    },
    autoPaginate: true,
  })
}

export type AuthStatus = "authenticated" | "needs_refresh" | "unauthenticated"

export async function getAuthStatus(): Promise<AuthStatus> {
  const { accessToken, refreshToken, expiresAt } = await getTokensFromCookies()

  // If we have a valid access token, we're authenticated
  if (accessToken && expiresAt && Date.now() < parseInt(expiresAt)) {
    return "authenticated"
  }

  // If we have a refresh token, we can try to refresh
  if (refreshToken) {
    return "needs_refresh"
  }

  return "unauthenticated"
}
