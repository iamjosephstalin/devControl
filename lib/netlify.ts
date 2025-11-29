export interface NetlifySite {
  id: string
  name: string
  url: string
  ssl_url: string
  state: 'processing' | 'ready' | 'error'
  updated_at: string
  created_at: string
  build_settings?: {
    repo_url?: string
    branch?: string
  }
}

export interface NetlifyDeployment {
  id: string
  site_id: string
  state: 'new' | 'pending' | 'building' | 'ready' | 'error'
  url: string
  deploy_url: string
  created_at: string
  published_at?: string
  commit_ref?: string
  commit_url?: string
}

export async function fetchNetlifySites(token: string): Promise<NetlifySite[]> {
  const response = await fetch('https://api.netlify.com/api/v1/sites', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch Netlify sites')
  }

  return response.json()
}

export async function fetchNetlifyDeployments(
  token: string,
  siteId: string
): Promise<NetlifyDeployment[]> {
  const response = await fetch(
    `https://api.netlify.com/api/v1/sites/${siteId}/deploys?per_page=10`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error('Failed to fetch Netlify deployments')
  }

  return response.json()
}

