export interface RailwayProject {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface RailwayService {
  id: string
  name: string
  projectId: string
  createdAt: string
  updatedAt: string
}

export interface RailwayDeployment {
  id: string
  serviceId: string
  status: 'BUILDING' | 'DEPLOYING' | 'SUCCESS' | 'FAILED' | 'CANCELLED'
  createdAt: string
  finishedAt?: string
  url?: string
}

export async function fetchRailwayProjects(token: string): Promise<RailwayProject[]> {
  const response = await fetch('https://backboard.railway.app/graphql/v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: `
        query {
          projects {
            edges {
              node {
                id
                name
                description
                createdAt
                updatedAt
              }
            }
          }
        }
      `,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to fetch Railway projects')
  }

  const data = await response.json()
  return data.data?.projects?.edges?.map((edge: any) => edge.node) || []
}

export async function fetchRailwayServices(
  token: string,
  projectId: string
): Promise<RailwayService[]> {
  const response = await fetch('https://backboard.railway.app/graphql/v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: `
        query($projectId: String!) {
          project(id: $projectId) {
            services {
              edges {
                node {
                  id
                  name
                  projectId
                  createdAt
                  updatedAt
                }
              }
            }
          }
        }
      `,
      variables: { projectId },
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to fetch Railway services')
  }

  const data = await response.json()
  return data.data?.project?.services?.edges?.map((edge: any) => edge.node) || []
}

