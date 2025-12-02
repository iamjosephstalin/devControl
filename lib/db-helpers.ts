import { queryOne, queryMany, query } from './postgres'
import { randomUUID } from 'crypto'

// Table names are PascalCase (Initcaps) as created by Prisma
const tableMap: Record<string, string> = {
  'User': 'User',
  'Task': 'Task',
  'Project': 'Project',
  'Note': 'Note',
  'Secret': 'Secret',
  'Server': 'Server',
  'Permission': 'Permission',
  'ProjectAssignment': 'ProjectAssignment',
  'Deployment': 'Deployment',
  'Account': 'Account',
  'Session': 'Session',
  'VerificationToken': 'VerificationToken',
  'Domain': 'Domain',
  'Activity': 'Activity',
  'Integration': 'Integration',
}

function getTableName(modelName: string): string {
  return tableMap[modelName] || modelName
}

// Helper functions to make Supabase queries more Prisma-like
export const db = {
  user: {
    findUnique: async (args: { where: { id?: string; email?: string } }) => {
      const { where } = args
      
      try {
        let sql = 'SELECT * FROM "User" WHERE '
        const params: any[] = []
        const conditions: string[] = []
        
        if (where.id) {
          conditions.push(`"id" = $${params.length + 1}`)
          params.push(where.id)
        }
        if (where.email) {
          // Use LOWER for case-insensitive email comparison
          conditions.push(`LOWER("email") = LOWER($${params.length + 1})`)
          params.push(where.email)
        }
        
        if (conditions.length === 0) {
          return null
        }
        
        sql += conditions.join(' AND ') + ' LIMIT 1'
        
        const user = await queryOne(sql, params)
        return user
      } catch (error: any) {
        console.error('User findUnique error:', error.message)
        
        // Log additional SSL error details
        if (error.message?.includes('certificate') || error.message?.includes('SSL')) {
          console.error('SSL Error in User findUnique:', {
            code: error.code,
            message: error.message,
            environment: process.env.NODE_ENV,
            query: sql,
            params: params?.map((p, i) => i === 0 ? '***' : p) // Hide potentially sensitive first param (email)
          })
        }
        
        return null
      }
    },
    findMany: async (args?: { where?: any; select?: any; orderBy?: any }) => {
      try {
        // Handle select - if select is provided, only select those fields
        let selectFields = '*'
        if (args?.select && typeof args.select === 'object') {
          const selectedFields = Object.keys(args.select).filter(key => args.select![key] === true)
          if (selectedFields.length > 0) {
            selectFields = selectedFields.map(f => `"${f}"`).join(', ')
          }
        }
        
        let sql = `SELECT ${selectFields} FROM "User"`
        const params: any[] = []
        const conditions: string[] = []
        
        if (args?.where) {
          Object.entries(args.where).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              conditions.push(`"${key}" = $${params.length + 1}`)
              params.push(value)
            }
          })
        }
        
        if (conditions.length > 0) {
          sql += ' WHERE ' + conditions.join(' AND ')
        }
        
        if (args?.orderBy) {
          const [field, direction] = Object.entries(args.orderBy)[0]
          sql += ` ORDER BY "${field}" ${String(direction).toUpperCase()}`
        }
        
        return await queryMany(sql, params)
      } catch (error: any) {
        console.error('User findMany error:', error)
        return []
      }
    },
    create: async (args: { data: any; select?: any }) => {
      try {
        // Remove id, createdAt, updatedAt from data - handle them separately
        const { id, createdAt, updatedAt, ...dataWithoutId } = args.data
        
        // Always include id, createdAt, updatedAt fields
        const fields = ['id', ...Object.keys(dataWithoutId), 'createdAt', 'updatedAt']
        const values = Object.values(dataWithoutId)
        
        // Build VALUES: id first (gen_random_uuid() or parameter), then other fields, then timestamps
        const idValue = id ? `$${values.length + 1}` : 'gen_random_uuid()'
        const otherValues = values.length > 0 ? values.map((_, i) => `$${i + 1}`).join(', ') + ', ' : ''
        const createdAtValue = createdAt ? `$${values.length + (id ? 2 : 1)}` : 'NOW()'
        const updatedAtValue = updatedAt ? `$${values.length + (id ? 3 : 2)}` : 'NOW()'
        const valuesClause = `${idValue}, ${otherValues}${createdAtValue}, ${updatedAtValue}`
        
        // Build final values array
        let finalValues = [...values]
        if (id) finalValues.push(id)
        if (createdAt) finalValues.push(createdAt)
        if (updatedAt) finalValues.push(updatedAt)
        
        const sql = `
          INSERT INTO "User" (${fields.map(f => `"${f}"`).join(', ')})
          VALUES (${valuesClause})
          RETURNING *
        `
        
        return await queryOne(sql, finalValues)
      } catch (error: any) {
        console.error('User create error:', error.message)
        throw error
      }
    },
    update: async (args: { where: { id: string }; data: any }) => {
      try {
        const updateFields = Object.keys(args.data)
        const updateValues = Object.values(args.data)
        const setClause = updateFields.map((f, i) => `"${f}" = $${i + 1}`).join(', ')
        
        const sql = `
          UPDATE "User"
          SET ${setClause}
          WHERE id = $${updateFields.length + 1}
          RETURNING *
        `
        
        return await queryOne(sql, [...updateValues, args.where.id])
      } catch (error: any) {
        console.error('User update error:', error)
        throw error
      }
    },
    delete: async (args: { where: { id: string } }) => {
      try {
        const sql = 'DELETE FROM "User" WHERE id = $1 RETURNING *'
        await query(sql, [args.where.id])
        return { id: args.where.id }
      } catch (error: any) {
        console.error('User delete error:', error)
        throw error
      }
    },
    count: async () => {
      try {
        const result = await query('SELECT COUNT(*) as count FROM "User"')
        return parseInt(result.rows[0]?.count || '0', 10)
      } catch (error: any) {
        console.error('User count error:', error)
        return 0
      }
    },
  },
  
  // Generic helper for other tables
  getTable: (modelName: string) => {
    const tableName = getTableName(modelName)
    return {
    findUnique: async (args: { where: { id?: string; [key: string]: any } }) => {
      const { where } = args
      try {
        let sql = `SELECT * FROM "${tableName}" WHERE `
        const params: any[] = []
        const conditions: string[] = []
        
        Object.entries(where).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            conditions.push(`"${key}" = $${params.length + 1}`)
            params.push(value)
          }
        })
        
        if (conditions.length === 0) return null
        sql += conditions.join(' AND ') + ' LIMIT 1'
        
        return await queryOne(sql, params)
      } catch (error: any) {
        console.error(`${tableName} findUnique error:`, error)
        return null
      }
    },
    findFirst: async (args: { where: { [key: string]: any }; include?: any; select?: any }) => {
      const { where, select } = args
      try {
        const selectFields = select 
          ? Object.keys(select).filter(key => select[key] === true).map(f => `"${f}"`).join(', ')
          : '*'
        
        let sql = `SELECT ${selectFields} FROM "${tableName}" WHERE `
        const params: any[] = []
        const conditions: string[] = []
        
        Object.entries(where).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (typeof value === 'object' && value.not) {
              conditions.push(`"${key}" != $${params.length + 1}`)
              params.push(value.not)
            } else {
              conditions.push(`"${key}" = $${params.length + 1}`)
              params.push(value)
            }
          }
        })
        
        if (conditions.length === 0) return null
        sql += conditions.join(' AND ') + ' LIMIT 1'
        
        return await queryOne(sql, params)
      } catch (error: any) {
        console.error(`${tableName} findFirst error:`, error)
        return null
      }
    },
    findMany: async (args?: { 
      where?: { [key: string]: any }
      include?: any
      select?: any
      orderBy?: { [key: string]: 'asc' | 'desc' }
      take?: number
    }) => {
      try {
        const selectFields = args?.select 
          ? Object.keys(args.select).filter(key => args.select![key] === true).map(f => `"${f}"`).join(', ')
          : '*'
        
        let sql = `SELECT ${selectFields} FROM "${tableName}"`
        const params: any[] = []
        const conditions: string[] = []
        
        if (args?.where) {
          Object.entries(args.where).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              if (typeof value === 'object' && value.not) {
                conditions.push(`"${key}" != $${params.length + 1}`)
                params.push(value.not)
              } else {
                conditions.push(`"${key}" = $${params.length + 1}`)
                params.push(value)
              }
            }
          })
        }
        
        if (conditions.length > 0) {
          sql += ' WHERE ' + conditions.join(' AND ')
        }
        
        if (args?.orderBy) {
          const [field, direction] = Object.entries(args.orderBy)[0]
          sql += ` ORDER BY "${field}" ${String(direction).toUpperCase()}`
        }
        
        if (args?.take) {
          sql += ` LIMIT ${args.take}`
        }
        
        return await queryMany(sql, params)
      } catch (error: any) {
        console.error(`${tableName} findMany error:`, error)
        return []
      }
    },
    create: async (args: { data: any; select?: any }) => {
      try {
        // Remove id, createdAt, updatedAt from data - handle them separately
        const { id, createdAt, updatedAt, ...dataWithoutId } = args.data
        
        // Check if table has timestamp columns (most tables do)
        const hasTimestamps = ['User', 'Project', 'Task', 'Note', 'Secret', 'Server', 'Domain', 'Activity', 'Deployment', 'ProjectAssignment', 'Integration'].includes(tableName)
        
        // Build fields array
        const fields = ['id', ...Object.keys(dataWithoutId)]
        if (hasTimestamps) {
          fields.push('createdAt', 'updatedAt')
        }
        
        const values = Object.values(dataWithoutId)
        
        // Build VALUES clause
        let paramIndex = 1
        const idValue = id ? `$${paramIndex++}` : 'gen_random_uuid()'
        const otherValues = values.map(() => `$${paramIndex++}`).join(', ')
        
        let valuesClause = idValue
        if (values.length > 0) {
          valuesClause += ', ' + otherValues
        }
        
        // Add timestamps
        if (hasTimestamps) {
          const createdAtVal = createdAt ? `$${paramIndex++}` : 'NOW()'
          const updatedAtVal = updatedAt ? `$${paramIndex++}` : 'NOW()'
          valuesClause += `, ${createdAtVal}, ${updatedAtVal}`
        }
        
        // Build final values array
        let finalValues = [...values]
        if (id) finalValues.push(id)
        if (hasTimestamps) {
          if (createdAt) finalValues.push(createdAt)
          if (updatedAt) finalValues.push(updatedAt)
        }
        
        const sql = `
          INSERT INTO "${tableName}" (${fields.map(f => `"${f}"`).join(', ')})
          VALUES (${valuesClause})
          RETURNING *
        `
        
        return await queryOne(sql, finalValues)
      } catch (error: any) {
        console.error(`${tableName} create error:`, error.message)
        throw error
      }
    },
    update: async (args: { where: { id: string }; data: any }) => {
      try {
        const updateFields = Object.keys(args.data)
        const updateValues = Object.values(args.data)
        const setClause = updateFields.map((f, i) => `"${f}" = $${i + 1}`).join(', ')
        
        const sql = `
          UPDATE "${tableName}"
          SET ${setClause}
          WHERE id = $${updateFields.length + 1}
          RETURNING *
        `
        
        return await queryOne(sql, [...updateValues, args.where.id])
      } catch (error: any) {
        console.error(`${tableName} update error:`, error)
        throw error
      }
    },
    updateMany: async (args: { where: { [key: string]: any }; data: any }) => {
      try {
        const updateFields = Object.keys(args.data)
        const updateValues = Object.values(args.data)
        const setClause = updateFields.map((f, i) => `"${f}" = $${i + 1}`).join(', ')
        
        const whereConditions: string[] = []
        const whereParams: any[] = []
        let paramOffset = updateFields.length
        
        Object.entries(args.where).forEach(([key, value]) => {
          whereConditions.push(`"${key}" = $${paramOffset + 1}`)
          whereParams.push(value)
          paramOffset++
        })
        
        const sql = `
          UPDATE "${tableName}"
          SET ${setClause}
          WHERE ${whereConditions.join(' AND ')}
          RETURNING *
        `
        
        const result = await queryMany(sql, [...updateValues, ...whereParams])
        return { count: result.length }
      } catch (error: any) {
        console.error(`${tableName} updateMany error:`, error)
        throw error
      }
    },
    upsert: async (args: { where: any; update: any; create: any }) => {
      try {
        // Try to find existing record first
        const existing = await db.getTable(tableName).findFirst({ where: args.where })
        
        if (existing) {
          // Update existing record
          if (Object.keys(args.update).length > 0) {
            return await db.getTable(tableName).update({ 
              where: { id: existing.id }, 
              data: args.update 
            })
          }
          return existing
        } else {
          // Create new record
          return await db.getTable(tableName).create({ data: args.create })
        }
      } catch (error: any) {
        console.error(`${tableName} upsert error:`, error)
        throw error
      }
    },
    delete: async (args: { where: { id: string } }) => {
      try {
        const sql = `DELETE FROM "${tableName}" WHERE id = $1 RETURNING *`
        await query(sql, [args.where.id])
        return { id: args.where.id }
      } catch (error: any) {
        console.error(`${tableName} delete error:`, error)
        throw error
      }
    },
    deleteMany: async (args: { where: { [key: string]: any } }) => {
      try {
        let sql = `DELETE FROM "${tableName}" WHERE `
        const params: any[] = []
        const conditions: string[] = []
        
        Object.entries(args.where).forEach(([key, value]) => {
          conditions.push(`"${key}" = $${params.length + 1}`)
          params.push(value)
        })
        
        if (conditions.length === 0) {
          throw new Error('deleteMany requires at least one where condition')
        }
        
        sql += conditions.join(' AND ')
        await query(sql, params)
        return { success: true }
      } catch (error: any) {
        console.error(`${tableName} deleteMany error:`, error)
        throw error
      }
    },
    }
  },
}

// Export Prisma-like accessors for each table
export const prisma = {
  user: db.user,
  task: db.getTable('Task'),
  project: db.getTable('Project'),
  note: db.getTable('Note'),
  secret: db.getTable('Secret'),
  server: db.getTable('Server'),
  permission: db.getTable('Permission'),
  projectAssignment: db.getTable('ProjectAssignment'),
  deployment: db.getTable('Deployment'),
  account: db.getTable('Account'),
  session: db.getTable('Session'),
  verificationToken: db.getTable('VerificationToken'),
  domain: db.getTable('Domain'),
  activity: db.getTable('Activity'),
  integration: db.getTable('Integration'),
}

