
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
