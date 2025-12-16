import { NextResponse } from "next/server"
import { clearTokenCookies } from "@/lib/auth"

export async function POST() {
  await clearTokenCookies()
  return NextResponse.json({ success: true })
}
