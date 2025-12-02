export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  stargazers_count: number
  forks_count: number
  updated_at: string
  language: string | null
  private: boolean
  archived: boolean
  default_branch: string
  open_issues_count?: number
  size?: number
  clone_url?: string
  ssh_url?: string
}

export interface GitHubCommit {
  sha: string
  node_id: string
  commit: {
    author: {
      name: string
      email: string
      date: string
    }
    committer: {
      name: string
      email: string
      date: string
    }
    message: string
    url: string
  }
  author: {
    login: string
    avatar_url: string
    html_url: string
  } | null
  committer: {
    login: string
    avatar_url: string
    html_url: string
  } | null
  html_url: string
}

export interface GitHubBranch {
  name: string
  commit: {
    sha: string
    url: string
  }
  protected: boolean
}

export interface GitHubPullRequest {
  id: number
  number: number
  title: string
  state: 'open' | 'closed' | 'merged'
  user: {
    login: string
    avatar_url: string
  }
  created_at: string
  updated_at: string
  html_url: string
  head: {
    ref: string
    sha: string
  }
  base: {
    ref: string
    sha: string
  }
}

export async function fetchGitHubRepos(token: string): Promise<GitHubRepo[]> {
  const response = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
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
  branch?: string,
  limit: number = 10
): Promise<GitHubCommit[]> {
  const url = new URL(`https://api.github.com/repos/${owner}/${repo}/commits`)
  url.searchParams.set('per_page', limit.toString())
  if (branch) url.searchParams.set('sha', branch)

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch GitHub commits')
  }

  return response.json()
}

export async function fetchGitHubBranches(
  token: string,
  owner: string,
  repo: string
): Promise<GitHubBranch[]> {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches`, {
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch GitHub branches')
  }

  return response.json()
}

export async function fetchGitHubPullRequests(
  token: string,
  owner: string,
  repo: string,
  state: 'open' | 'closed' | 'all' = 'open'
): Promise<GitHubPullRequest[]> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls?state=${state}&per_page=20`,
    {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    }
  )

  if (!response.ok) {
    throw new Error('Failed to fetch GitHub pull requests')
  }

  return response.json()
}

export async function fetchGitHubRepoStats(
  token: string,
  owner: string,
  repo: string
): Promise<{
  languages: Record<string, number>
  contributors: Array<{
    login: string
    avatar_url: string
    contributions: number
  }>
  codeFrequency: Array<[number, number, number]>
}> {
  const [languagesRes, contributorsRes, codeFreqRes] = await Promise.all([
    fetch(`https://api.github.com/repos/${owner}/${repo}/languages`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    }),
    fetch(`https://api.github.com/repos/${owner}/${repo}/contributors?per_page=10`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    }),
    fetch(`https://api.github.com/repos/${owner}/${repo}/stats/code_frequency`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    }),
  ])

  const [languages, contributors, codeFrequency] = await Promise.all([
    languagesRes.ok ? languagesRes.json() : {},
    contributorsRes.ok ? contributorsRes.json() : [],
    codeFreqRes.ok ? codeFreqRes.json() : [],
  ])

  return {
    languages,
    contributors,
    codeFrequency,
  }
}

// Keep the original function for backward compatibility
export async function fetchGitHubRepoDetails(repoUrl: string) {
  try {
    // Extract owner and repo from URL
    // Expected format: https://github.com/owner/repo
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/)
    if (!match) return null

    const owner = match[1]
    const repo = match[2].replace(".git", "")

    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=1`)
    if (!res.ok) return null

    const commits = await res.json()
    if (commits.length === 0) return null

    const lastCommit = commits[0]
    return {
      lastCommitDate: new Date(lastCommit.commit.author.date),
      lastCommitMessage: lastCommit.commit.message,
      lastCommitHash: lastCommit.sha,
    }
  } catch (error) {
    console.error("Failed to fetch GitHub repo details:", error)
    return null
  }
}
