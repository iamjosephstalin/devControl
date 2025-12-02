import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, validateSessionUser } from "@/lib/auth"
import { prisma } from "@/lib/db-helpers"
import { decrypt } from "@/lib/encryption"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const sessionUserId = await validateSessionUser(session?.user?.id)
    
    if (!sessionUserId) {
      return NextResponse.json({ 
        error: "Unauthorized. Please log out and log back in." 
      }, { status: 401 })
    }

    // Get all integrations for this user
    const integrations = await prisma.integration.findMany({
      where: { userId: sessionUserId }
    })

    const results = {
      total: integrations.length,
      working: 0,
      corrupted: 0,
      deleted: 0,
      corruptedIds: [] as string[]
    }

    for (const integration of integrations) {
      try {
        if (integration.encryptedConfig) {
          const decrypted = decrypt(integration.encryptedConfig)
          JSON.parse(decrypted)
          results.working++
        } else {
          results.working++
        }
      } catch (error) {
        console.log(`Corrupted integration found: ${integration.id} (${integration.name})`)
        results.corrupted++
        results.corruptedIds.push(integration.id)
        
        // Mark as error status instead of deleting
        await prisma.integration.update({
          where: { id: integration.id },
          data: { status: 'error' }
        })
      }
    }

    return NextResponse.json({
      message: "Integration repair completed",
      results
    })
  } catch (error: any) {
    console.error("Error in integration repair:", error)
    return NextResponse.json(
      { error: error.message || "Failed to repair integrations" },
      { status: 500 }
    )
  }
}