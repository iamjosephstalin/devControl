// Role-Based Access Control (RBAC) system
import { prisma } from "@/lib/db"

export type Role = 'admin' | 'client'
export type Resource = 'projects' | 'tasks' | 'secrets' | 'servers' | 'notes' | 'integrations' | 'deployments' | 'users'
export type Action = 'read' | 'write' | 'delete' | 'manage'

export interface UserSession {
  id: string
  email: string
  role: Role
  name?: string
}

// Check if user has permission for a specific action on a resource
export async function hasPermission(
  userId: string, 
  role: Role, 
  resource: Resource, 
  action: Action
): Promise<boolean> {
  try {
    // Admin always has all permissions
    if (role === 'admin') {
      return true
    }

    // Check if the client role has this specific permission
    const permission = await prisma.permission.findFirst({
      where: {
        role: role,
        resource: resource,
        action: action
      }
    })

    return !!permission
  } catch (error) {
    console.error('Permission check failed:', error)
    return false
  }
}

// Get user session from existing auth validation (used in API routes)
export async function getUserFromId(userId: string): Promise<UserSession | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return null
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name || undefined,
      role: (user.role as Role) || 'client'
    }
  } catch (error) {
    console.error('User retrieval failed:', error)
    return null
  }
}

// Middleware to check permission for a user ID
export async function requirePermissionForUser(
  userId: string,
  resource: Resource, 
  action: Action
): Promise<UserSession> {
  const user = await getUserFromId(userId)
  
  if (!user) {
    throw new Error('Unauthorized: No valid user found')
  }

  const hasAccess = await hasPermission(user.id, user.role, resource, action)
  
  if (!hasAccess) {
    throw new Error(`Forbidden: Insufficient permissions for ${action} on ${resource}`)
  }

  return user
}

// Data filtering based on user role and project assignments
export const dataFilters = {
  // Projects: Clients ONLY see projects they are explicitly assigned to
  projects: (userId: string, role: Role) => {
    if (role === 'admin') {
      return {} // Admin sees all projects
    }
    // Clients can ONLY access projects through assignments
    return {
      projectAssignments: {
        some: { userId: userId }
      }
    }
  },

  // Tasks: Clients see tasks in assigned projects OR their own general tasks
  tasks: (userId: string, role: Role) => {
    if (role === 'admin') {
      return {} // Admin sees all tasks
    }
    return {
      OR: [
        // General tasks created by the user (no project)
        {
          AND: [
            { userId: userId },
            { projectId: null }
          ]
        },
        // Tasks in projects they are assigned to
        {
          AND: [
            { projectId: { not: null } },
            {
              project: {
                projectAssignments: {
                  some: { userId: userId }
                }
              }
            }
          ]
        }
      ]
    }
  },

  // Secrets: Clients ONLY see secrets in projects they are assigned to
  secrets: (userId: string, role: Role) => {
    if (role === 'admin') {
      return {} // Admin sees all secrets
    }
    // Secrets MUST be linked to a project and user must be assigned to that project
    return {
      AND: [
        { projectId: { not: null } }, // Secret must be linked to a project
        {
          project: {
            projectAssignments: {
              some: { userId: userId }
            }
          }
        }
      ]
    }
  },

  // Notes: Clients see notes in assigned projects OR their own general notes
  notes: (userId: string, role: Role) => {
    if (role === 'admin') {
      return {} // Admin sees all notes
    }
    return {
      OR: [
        // General notes created by the user (no project)
        {
          AND: [
            { userId: userId },
            { projectId: null }
          ]
        },
        // Notes in projects they are assigned to
        {
          AND: [
            { projectId: { not: null } },
            {
              project: {
                projectAssignments: {
                  some: { userId: userId }
                }
              }
            }
          ]
        }
      ]
    }
  },

  // Servers: Admin only (clients shouldn't see servers)
  servers: (userId: string, role: Role) => {
    if (role === 'admin') {
      return {} // Admin sees all servers
    }
    return {
      id: 'never-match' // Clients see no servers
    }
  },

  // Integrations: Clients only see integrations in their projects
  integrations: (userId: string, role: Role) => {
    if (role === 'admin') {
      return {} // Admin sees all integrations
    }
    return {
      OR: [
        { userId: userId }, // Integrations created by the user
        {
          projects: {
            some: {
              OR: [
                { userId: userId }, // Integrations linked to projects they own
                {
                  projectAssignments: {
                    some: { userId: userId }
                  }
                } // Integrations linked to projects they're assigned to
              ]
            }
          }
        }
      ]
    }
  },

  // Deployments: Clients only see deployments of their projects
  deployments: (userId: string, role: Role) => {
    if (role === 'admin') {
      return {} // Admin sees all deployments
    }
    return {
      OR: [
        { userId: userId }, // Deployments created by the user
        {
          project: {
            OR: [
              { userId: userId }, // Deployments of projects they own
              {
                projectAssignments: {
                  some: { userId: userId }
                }
              } // Deployments of projects they're assigned to
            ]
          }
        }
      ]
    }
  },

  // Users: Admin only
  users: (userId: string, role: Role) => {
    if (role === 'admin') {
      return {} // Admin sees all users
    }
    return {
      id: userId // Clients only see themselves
    }
  }
}

// Helper function to get data filter for a resource
export function getDataFilter(resource: Resource, userId: string, role: Role) {
  const filterFunc = dataFilters[resource]
  return filterFunc ? filterFunc(userId, role) : {}
}

// Page access control - defines which pages each role can access
export const pageAccess = {
  admin: [
    '/', '/projects', '/tasks', '/secrets', '/servers', '/notes', 
    '/integrations', '/deployments', '/users', '/settings', '/infrastructure',
    '/version-control', '/schedule', '/profile'
  ],
  client: [
    '/projects', '/tasks', '/notes', '/profile', '/schedule'
    // Clients cannot access: servers, secrets (write), users, settings, infrastructure, etc.
  ]
}

// Check if user can access a specific page
export function canAccessPage(role: Role, pathname: string): boolean {
  const allowedPages = pageAccess[role] || []
  
  // Check exact match first
  if (allowedPages.includes(pathname)) {
    return true
  }
  
  // Check if it's a dynamic route that user has access to
  for (const allowedPage of allowedPages) {
    if (allowedPage.includes('[') || pathname.startsWith(allowedPage.replace(/\[[^\]]*\]/g, ''))) {
      return true
    }
  }
  
  return false
}