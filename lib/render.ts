export interface RenderService {
  id: string
  name: string
  type: 'web_service' | 'background_worker' | 'static_site' | 'cron_job'
  serviceDetails: {
    url?: string
    healthCheckPath?: string
  }
  createdAt: string
  updatedAt: string
  suspendedAt?: string
  suspended: boolean
}

export interface RenderDeployment {
  id: string
  serviceId: string
  status: 'live' | 'build_failed' | 'update_failed' | 'deactivated'
  commit: {
    id: string
    message: string
    createdAt: string
  }
  createdAt: string
  finishedAt?: string
  image?: {
    imagePath: string
  }
}

export async function fetchRenderServices(token: string): Promise<RenderService[]> {
  const response = await fetch('https://api.render.com/v1/services', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch Render services')
  }

  return response.json()
}

export async function fetchRenderDeployments(
  token: string,
  serviceId: string
): Promise<RenderDeployment[]> {
  const response = await fetch(
    `https://api.render.com/v1/services/${serviceId}/deploys?limit=10`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error('Failed to fetch Render deployments')
  }

  return response.json()
}

