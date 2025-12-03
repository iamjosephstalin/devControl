import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, validateSessionUser } from "@/lib/auth"
import { prisma } from "@/lib/db-helpers"
import { encrypt, decrypt } from "@/lib/encryption"

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const sessionUserId = await validateSessionUser(session?.user?.id)
    
    if (!sessionUserId) {
      return NextResponse.json({ 
        error: "Unauthorized. Please log out and log back in." 
      }, { status: 401 })
    }

    const integrations = await prisma.integration.findMany({
      where: { userId: sessionUserId },
      orderBy: { updatedAt: "desc" },
    })

    // Decrypt and return integration details (without sensitive tokens)
    const safeIntegrations = integrations.map((integration: any) => {
      let config: any = {}
      try {
        if (integration.encryptedConfig) {
          const decrypted = decrypt(integration.encryptedConfig)
          config = JSON.parse(decrypted)
        }
      } catch (error) {
        console.error("Failed to decrypt integration config for", integration.id, ":", error)
        // Return integration with error status instead of failing completely
        config = {}
      }

      return {
        id: integration.id,
        type: integration.type,
        name: integration.name,
        status: Object.keys(config).length === 0 ? 'error' : integration.status,
        lastSync: integration.lastSync,
        createdAt: integration.createdAt,
        updatedAt: integration.updatedAt,
        // Include non-sensitive config details
        config: {
          teamId: config.teamId || null,
          baseUrl: config.baseUrl || null,
          username: config.username || null,
          // Never return tokens or sensitive data
        }
      }
    })

    return NextResponse.json(safeIntegrations)
  } catch (error: any) {
    console.error("Error in GET /api/integrations:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch integrations" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const sessionUserId = await validateSessionUser(session?.user?.id)
    
    if (!sessionUserId) {
      return NextResponse.json({ 
        error: "Unauthorized. Please log out and log back in." 
      }, { status: 401 })
    }

    const body = await request.json()
    const { type, name, token, config = {} } = body

    if (!type || !name) {
      return NextResponse.json(
        { error: "Type and name are required" },
        { status: 400 }
      )
    }

    // For some integrations, the "token" might be in config fields
    let actualToken = token
    if (!actualToken) {
      if (type === 'aws' && config.token) {
        actualToken = config.token // Secret Access Key
      } else if (type === 'azure' && config.token) {
        actualToken = config.token // Client Secret
      } else if (type === 'gcp' && config.token) {
        actualToken = config.token // Service Account Key
      }
    }

    if (!actualToken) {
      return NextResponse.json(
        { error: `Authentication token/key is required for ${type}` },
        { status: 400 }
      )
    }

    // Validate integration type
    const validTypes = ['github', 'gitlab', 'bitbucket', 'vercel', 'netlify', 'railway', 'render', 'aws', 'heroku', 'azure', 'gcp']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Invalid integration type" },
        { status: 400 }
      )
    }

    // Test the integration before saving (skip for now to allow connection)
    try {
      // Only test for basic token format validation, not actual API calls
      await validateIntegrationFormat(type, actualToken, config)
    } catch (error: any) {
      console.error(`Integration validation failed for ${type}:`, error.message)
      return NextResponse.json(
        { error: `Integration validation failed: ${error.message}` },
        { status: 400 }
      )
    }

    // Encrypt the sensitive configuration
    const sensitiveConfig = {
      token: actualToken,
      ...config
    }
    const encryptedConfig = encrypt(JSON.stringify(sensitiveConfig))

    // Check if integration already exists for this user and type
    const existingIntegration = await prisma.integration.findFirst({
      where: { 
        userId: sessionUserId,
        type,
        name
      }
    })

    let integration
    if (existingIntegration) {
      // Update existing integration
      integration = await prisma.integration.update({
        where: { id: existingIntegration.id },
        data: {
          encryptedConfig,
          status: 'connected',
          lastSync: new Date(),
          updatedAt: new Date()
        }
      })
    } else {
      // Create new integration
      integration = await prisma.integration.create({
        data: {
          userId: sessionUserId,
          type,
          name,
          encryptedConfig,
          status: 'connected',
          lastSync: new Date()
        }
      })
    }

    return NextResponse.json({
      id: integration.id,
      type: integration.type,
      name: integration.name,
      status: integration.status,
      lastSync: integration.lastSync,
      createdAt: integration.createdAt,
      updatedAt: integration.updatedAt
    }, { status: 201 })
  } catch (error: any) {
    console.error("Error in POST /api/integrations:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create integration" },
      { status: 500 }
    )
  }
}

async function validateIntegrationFormat(type: string, token: string, config: any) {
  // Basic format validation without making actual API calls
  switch (type) {
    case 'github':
      if (!token || token.length < 10) {
        throw new Error('GitHub token must be at least 10 characters')
      }
      break
    case 'gitlab':
      if (!token || token.length < 10) {
        throw new Error('GitLab token must be at least 10 characters')
      }
      break
    case 'bitbucket':
      if (!token || !config.username) {
        throw new Error('Bitbucket requires both username and app password')
      }
      break
    case 'vercel':
      if (!token || token.length < 20) {
        throw new Error('Vercel API token format is invalid')
      }
      break
    case 'netlify':
      if (!token || token.length < 20) {
        throw new Error('Netlify API token format is invalid')
      }
      break
    case 'railway':
      if (!token || token.length < 20) {
        throw new Error('Railway API token format is invalid')
      }
      break
    case 'render':
      if (!token || token.length < 20) {
        throw new Error('Render API key format is invalid')
      }
      break
    case 'aws':
      if (!config.accessKeyId || !token) {
        throw new Error('AWS Access Key ID and Secret Access Key are required')
      }
      if (config.accessKeyId.length < 16 || token.length < 20) {
        throw new Error('AWS credentials format is invalid')
      }
      break
    case 'heroku':
      if (!token || token.length < 20) {
        throw new Error('Heroku API key format is invalid')
      }
      break
    case 'azure':
      if (!config.clientId || !config.tenantId || !token) {
        throw new Error('Azure Client ID, Tenant ID, and Client Secret are required')
      }
      break
    case 'gcp':
      if (!config.projectId || !token) {
        throw new Error('Google Cloud Project ID and Service Account Key are required')
      }
      try {
        const serviceKey = JSON.parse(token)
        if (!serviceKey.type || !serviceKey.private_key || !serviceKey.client_email) {
          throw new Error('Invalid Service Account Key format')
        }
      } catch {
        throw new Error('Service Account Key must be valid JSON')
      }
      break
    default:
      throw new Error(`Integration type ${type} not supported`)
  }
}