// Integration management utilities
export interface Integration {
  id: string
  type: IntegrationType
  name: string
  status: 'connected' | 'error' | 'disconnected'
  lastSync: string | null
  createdAt: string
  updatedAt: string
  config?: {
    teamId?: string
    baseUrl?: string
    username?: string
    token?: string
  }
}

export type IntegrationType = 'github' | 'gitlab' | 'bitbucket' | 'vercel' | 'netlify' | 'railway' | 'render' | 'aws' | 'heroku' | 'azure' | 'gcp'

export type VersionControlType = 'github' | 'gitlab' | 'bitbucket'
export type DeploymentType = 'vercel' | 'netlify' | 'railway' | 'render' | 'aws' | 'heroku' | 'azure' | 'gcp'

export const VERSION_CONTROL_TYPES: VersionControlType[] = ['github', 'gitlab', 'bitbucket']
export const DEPLOYMENT_TYPES: DeploymentType[] = ['vercel', 'netlify', 'railway', 'render', 'aws', 'heroku', 'azure', 'gcp']

export const INTEGRATION_CONFIG = {
  github: {
    name: 'GitHub',
    description: 'Connect your GitHub repositories',
    tokenUrl: 'https://github.com/settings/tokens',
    tokenLabel: 'Personal Access Token',
    icon: '🐙',
    fields: [
      { key: 'token', label: 'Personal Access Token', type: 'password', required: true }
    ]
  },
  gitlab: {
    name: 'GitLab',
    description: 'Connect your GitLab projects',
    tokenUrl: 'https://gitlab.com/-/profile/personal_access_tokens',
    tokenLabel: 'Access Token',
    icon: '🦊',
    fields: [
      { key: 'token', label: 'Access Token', type: 'password', required: true },
      { key: 'baseUrl', label: 'GitLab URL (optional)', type: 'text', placeholder: 'https://gitlab.com' }
    ]
  },
  bitbucket: {
    name: 'Bitbucket',
    description: 'Connect your Bitbucket repositories',
    tokenUrl: 'https://bitbucket.org/account/settings/app-passwords/',
    tokenLabel: 'App Password',
    icon: '🪣',
    fields: [
      { key: 'username', label: 'Username', type: 'text', required: true },
      { key: 'token', label: 'App Password', type: 'password', required: true }
    ]
  },
  vercel: {
    name: 'Vercel',
    description: 'Connect your Vercel deployments',
    tokenUrl: 'https://vercel.com/account/tokens',
    tokenLabel: 'API Token',
    icon: '▲',
    fields: [
      { key: 'token', label: 'API Token', type: 'password', required: true },
      { key: 'teamId', label: 'Team ID (optional)', type: 'text' }
    ]
  },
  netlify: {
    name: 'Netlify',
    description: 'Connect your Netlify sites',
    tokenUrl: 'https://app.netlify.com/user/applications#personal-access-tokens',
    tokenLabel: 'Personal Access Token',
    icon: '🌐',
    fields: [
      { key: 'token', label: 'Personal Access Token', type: 'password', required: true }
    ]
  },
  railway: {
    name: 'Railway',
    description: 'Connect your Railway deployments',
    tokenUrl: 'https://railway.app/account/tokens',
    tokenLabel: 'API Token',
    icon: '🚂',
    fields: [
      { key: 'token', label: 'API Token', type: 'password', required: true }
    ]
  },
  render: {
    name: 'Render',
    description: 'Connect your Render services',
    tokenUrl: 'https://dashboard.render.com/account/api-keys',
    tokenLabel: 'API Key',
    icon: '🎨',
    fields: [
      { key: 'token', label: 'API Key', type: 'password', required: true }
    ]
  },
  aws: {
    name: 'AWS',
    description: 'Connect your AWS services',
    tokenUrl: 'https://console.aws.amazon.com/iam/home#/security_credentials',
    tokenLabel: 'Access Keys',
    icon: '☁️',
    fields: [
      { key: 'accessKeyId', label: 'Access Key ID', type: 'text', required: true },
      { key: 'token', label: 'Secret Access Key', type: 'password', required: true },
      { key: 'region', label: 'Default Region', type: 'text', placeholder: 'us-east-1' }
    ]
  },
  heroku: {
    name: 'Heroku',
    description: 'Connect your Heroku apps',
    tokenUrl: 'https://dashboard.heroku.com/account/applications',
    tokenLabel: 'API Key',
    icon: '💜',
    fields: [
      { key: 'token', label: 'API Key', type: 'password', required: true }
    ]
  },
  azure: {
    name: 'Azure',
    description: 'Connect your Azure services',
    tokenUrl: 'https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps',
    tokenLabel: 'Service Principal',
    icon: '🔷',
    fields: [
      { key: 'clientId', label: 'Client ID', type: 'text', required: true },
      { key: 'token', label: 'Client Secret', type: 'password', required: true },
      { key: 'tenantId', label: 'Tenant ID', type: 'text', required: true }
    ]
  },
  gcp: {
    name: 'Google Cloud',
    description: 'Connect your Google Cloud services',
    tokenUrl: 'https://console.cloud.google.com/apis/credentials',
    tokenLabel: 'Service Account Key',
    icon: '🌐',
    fields: [
      { key: 'projectId', label: 'Project ID', type: 'text', required: true },
      { key: 'token', label: 'Service Account Key (JSON)', type: 'textarea', required: true }
    ]
  }
} as const

export async function fetchIntegrations(): Promise<Integration[]> {
  const response = await fetch('/api/integrations')
  if (!response.ok) {
    throw new Error('Failed to fetch integrations')
  }
  return response.json()
}

export async function createIntegration(data: {
  type: IntegrationType
  name: string
  token: string
  config?: Record<string, any>
}): Promise<Integration> {
  const response = await fetch('/api/integrations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create integration')
  }
  
  return response.json()
}

export async function updateIntegration(id: string, data: {
  name?: string
  token?: string
  config?: Record<string, any>
  status?: string
}): Promise<Integration> {
  const response = await fetch(`/api/integrations/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update integration')
  }
  
  return response.json()
}

export async function deleteIntegration(id: string): Promise<void> {
  const response = await fetch(`/api/integrations/${id}`, {
    method: 'DELETE'
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete integration')
  }
}

export async function getIntegrationToken(id: string): Promise<string> {
  const response = await fetch(`/api/integrations/${id}`)
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(`Failed to fetch integration token: ${errorData.error}`)
  }
  
  const integration = await response.json()
  if (!integration.config?.token) {
    throw new Error('Integration token not found or integration is corrupted')
  }
  
  return integration.config.token
}