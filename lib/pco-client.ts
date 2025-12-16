import { PlanningCenter } from "planning-center-api"
import { getTokensFromCookies, refreshAccessToken, setTokenCookies } from "./auth"

export async function getPCOClient() {
  const { accessToken, refreshToken, expiresAt } = await getTokensFromCookies()

  if (!accessToken || !refreshToken) {
    return null
  }

  // Check if token needs refresh (5 minutes before expiry)
  const needsRefresh = expiresAt && Date.now() > parseInt(expiresAt) - 5 * 60 * 1000

  if (needsRefresh) {
    try {
      const tokens = await refreshAccessToken(refreshToken)
      await setTokenCookies(
        tokens.access_token,
        tokens.refresh_token,
        tokens.expires_in
      )

      return new PlanningCenter({
        auth: {
          type: "bearer",
          bearerToken: tokens.access_token,
        },
      })
    } catch {
      return null
    }
  }

  return new PlanningCenter({
    auth: {
      type: "bearer",
      bearerToken: accessToken,
    },
  })
}
