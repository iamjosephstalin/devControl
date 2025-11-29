export interface GitLabRepo {
  id: number
  name: string
  name_with_namespace: string
  description: string | null
  web_url: string
  star_count: number
  forks_count: number
  last_activity_at: string
  default_branch: string
  visibility: 'private' | 'internal' | 'public'
  language?: string
}

export interface GitLabCommit {
  id: string
  message: string
  author_name: string
  authored_date: string
  web_url: string
}

export interface GitLabIssue {
  iid: number
  title: string
  description: string | null
  state: 'opened' | 'closed'
  web_url: string
  created_at: string
  updated_at: string
}

export interface GitLabMR {
  iid: number
  title: string
  state: 'opened' | 'closed' | 'merged'
  web_url: string
  created_at: string
  source_branch: string
  target_branch: string
}

export async function fetchGitLabRepos(
  token: string,
  baseUrl: string = 'https://gitlab.com'
): Promise<GitLabRepo[]> {
  const response = await fetch(`${baseUrl}/api/v4/projects?membership=true&per_page=100`, {
    headers: {
      'PRIVATE-TOKEN': token,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch GitLab repos')
  }

  return response.json()
}

export async function fetchGitLabCommits(
  token: string,
  projectId: number,
  branch: string = 'main',
  baseUrl: string = 'https://gitlab.com'
): Promise<GitLabCommit[]> {
  const response = await fetch(
    `${baseUrl}/api/v4/projects/${projectId}/repository/commits?ref_name=${branch}&per_page=10`,
    {
      headers: {
        'PRIVATE-TOKEN': token,
      },
    }
  )

  if (!response.ok) {
    throw new Error('Failed to fetch GitLab commits')
  }

  return response.json()
}

export async function fetchGitLabIssues(
  token: string,
  projectId: number,
  baseUrl: string = 'https://gitlab.com'
): Promise<GitLabIssue[]> {
  const response = await fetch(
    `${baseUrl}/api/v4/projects/${projectId}/issues?per_page=50`,
    {
      headers: {
        'PRIVATE-TOKEN': token,
      },
    }
  )

  if (!response.ok) {
    throw new Error('Failed to fetch GitLab issues')
  }

  return response.json()
}

export async function fetchGitLabMRs(
  token: string,
  projectId: number,
  baseUrl: string = 'https://gitlab.com'
): Promise<GitLabMR[]> {
  const response = await fetch(
    `${baseUrl}/api/v4/projects/${projectId}/merge_requests?per_page=50`,
    {
      headers: {
        'PRIVATE-TOKEN': token,
      },
    }
  )

  if (!response.ok) {
    throw new Error('Failed to fetch GitLab merge requests')
  }

  return response.json()
}

