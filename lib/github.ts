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
