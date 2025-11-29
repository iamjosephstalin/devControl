export interface VercelDeployment {
  uid: string
  name: string
  url: string
  state: 'READY' | 'BUILDING' | 'ERROR' | 'QUEUED' | 'CANCELED'
  createdAt: number
  readyAt?: number
  meta?: Record<string, any>
}

export interface VercelProject {
  id: string
  name: string
  accountId: string
  updatedAt: number
  createdAt: number
  latestDeployment?: VercelDeployment
}

export interface VercelDomain {
  name: string
  apexName: string
  projectId: string
  redirect?: string
  redirectStatusCode?: number
  gitBranch?: string
  updatedAt: number
  createdAt: number
}

export async function fetchVercelProjects(token: string, teamId?: string): Promise<VercelProject[]> {
  const url = teamId
    ? `https://api.vercel.com/v9/projects?teamId=${teamId}`
    : 'https://api.vercel.com/v9/projects'

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch Vercel projects')
  }

  const data = await response.json()
  return data.projects || []
}

export async function fetchVercelDeployments(
  token: string,
  projectId: string,
  teamId?: string
): Promise<VercelDeployment[]> {
  const url = teamId
    ? `https://api.vercel.com/v6/deployments?projectId=${projectId}&teamId=${teamId}&limit=10`
    : `https://api.vercel.com/v6/deployments?projectId=${projectId}&limit=10`

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch Vercel deployments')
  }

  const data = await response.json()
  return data.deployments || []
}

export async function fetchVercelDomains(
  token: string,
  projectId: string,
  teamId?: string
): Promise<VercelDomain[]> {
  const url = teamId
    ? `https://api.vercel.com/v9/projects/${projectId}/domains?teamId=${teamId}`
    : `https://api.vercel.com/v9/projects/${projectId}/domains`

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch Vercel domains')
  }

  return response.json()
}

