export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  stargazers_count: number
  forks_count: number
  updated_at: string
  default_branch: string
}

export interface GitHubCommit {
  sha: string
  commit: {
    message: string
    author: {
      name: string
      date: string
    }
  }
  html_url: string
}

export interface GitHubIssue {
  number: number
  title: string
  body: string | null
  state: 'open' | 'closed'
  html_url: string
  created_at: string
  updated_at: string
}

export interface GitHubPR {
  number: number
  title: string
  state: 'open' | 'closed' | 'merged'
  html_url: string
  created_at: string
  head: {
    ref: string
  }
  base: {
    ref: string
  }
}

export async function fetchGitHubRepos(token: string): Promise<GitHubRepo[]> {
  const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch GitHub repos')
  }

  return response.json()
}

export async function fetchGitHubCommits(
  token: string,
  owner: string,
  repo: string,
  branch: string = 'main'
): Promise<GitHubCommit[]> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/commits?sha=${branch}&per_page=10`,
    {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    }
  )

  if (!response.ok) {
    throw new Error('Failed to fetch GitHub commits')
  }

  return response.json()
}

export async function fetchGitHubIssues(
  token: string,
  owner: string,
  repo: string
): Promise<GitHubIssue[]> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/issues?state=all&per_page=50`,
    {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    }
  )

  if (!response.ok) {
    throw new Error('Failed to fetch GitHub issues')
  }

  return response.json()
}

export async function fetchGitHubPRs(
  token: string,
  owner: string,
  repo: string
): Promise<GitHubPR[]> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls?state=all&per_page=50`,
    {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    }
  )

  if (!response.ok) {
    throw new Error('Failed to fetch GitHub PRs')
  }

  return response.json()
}

