import { Pool } from 'pg'

let pool: Pool | null = null

function getPool(): Pool {
  if (!pool) {
    // Try DIRECT_URL first (for migrations), then DATABASE_URL
    const directUrl = process.env.DIRECT_URL
    const databaseUrl = process.env.DATABASE_URL
    
    let connectionString: string
    
    if (directUrl && (directUrl.startsWith('postgres://') || directUrl.startsWith('postgresql://'))) {
      connectionString = directUrl
    } else if (databaseUrl && (databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://'))) {
      connectionString = databaseUrl
    } else {
      throw new Error('Missing DATABASE_URL or DIRECT_URL environment variable')
    }
    
    // Parse connection string to extract SSL mode
    let sslConfig: any = false
    try {
      const url = new URL(connectionString.replace(/^postgres(ql)?:/, 'https:'))
      const sslMode = url.searchParams.get('sslmode') || 'require'
      
      // Always use SSL for Supabase connections
      // Supabase requires SSL but uses self-signed certificates
      // Set rejectUnauthorized to false to allow self-signed certificates
      if (sslMode === 'require' || sslMode === 'prefer') {
        sslConfig = {
          rejectUnauthorized: false,
          require: true
        }
      }
    } catch (e) {
      // If URL parsing fails, default to SSL with rejectUnauthorized false
      sslConfig = {
        rejectUnauthorized: false,
        require: true
      }
    }
    
    // Create pool with SSL configuration
    // For Supabase, we need to allow self-signed certificates
    pool = new Pool({
      connectionString,
      ssl: sslConfig,
      // Additional connection options
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })
    
    // Handle connection errors
    pool.on('error', (err) => {
      console.error('Postgres pool error:', err)
    })
  }
  
  return pool
}

// Helper to execute queries
export async function query(text: string, params?: any[]) {
  const pool = getPool()
  const client = await pool.connect()
  try {
    const result = await client.query(text, params)
    return result
  } catch (error: any) {
    console.error('Postgres query error:', error.message)
    throw error
  } finally {
    client.release()
  }
}

// Helper to get a single row
export async function queryOne(text: string, params?: any[]): Promise<any | null> {
  const result = await query(text, params)
  return result.rows[0] || null
}

// Helper to get multiple rows
export async function queryMany(text: string, params?: any[]): Promise<any[]> {
  const result = await query(text, params)
  return result.rows
}

export { getPool as pool }

