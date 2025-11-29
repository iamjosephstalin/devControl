export interface BitbucketRepo {
  uuid: string
  name: string
  full_name: string
  description: string | null
  links: {
    html: {
      href: string
    }
  }
  updated_on: string
  created_on: string
  is_private: boolean
  language?: string
  size: number
}

export interface BitbucketCommit {
  hash: string
  message: string
  author: {
    raw: string
    user?: {
      display_name: string
    }
  }
  date: string
  links: {
    html: {
      href: string
    }
  }
}

export interface BitbucketIssue {
  id: number
  title: string
  content?: {
    raw: string
  }
  state: 'new' | 'open' | 'resolved' | 'on hold' | 'invalid' | 'duplicate' | 'wontfix' | 'closed'
  kind: 'bug' | 'enhancement' | 'proposal' | 'task'
  links: {
    html: {
      href: string
    }
  }
  created_on: string
  updated_on: string
}

export interface BitbucketPR {
  id: number
  title: string
  description?: string
  state: 'OPEN' | 'MERGED' | 'DECLINED' | 'SUPERSEDED'
  links: {
    html: {
      href: string
    }
  }
  source: {
    branch: {
      name: string
    }
  }
  destination: {
    branch: {
      name: string
    }
  }
  created_on: string
  updated_on: string
}

export async function fetchBitbucketRepos(
  username: string,
  token: string
): Promise<BitbucketRepo[]> {
  const response = await fetch(
    `https://api.bitbucket.org/2.0/repositories/${username}?pagelen=100`,
    {
      headers: {
        Authorization: `Basic ${btoa(`${username}:${token}`)}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error('Failed to fetch Bitbucket repos')
  }

  const data = await response.json()
  return data.values || []
}

export async function fetchBitbucketCommits(
  username: string,
  repoSlug: string,
  token: string,
  branch: string = 'main'
): Promise<BitbucketCommit[]> {
  const response = await fetch(
    `https://api.bitbucket.org/2.0/repositories/${username}/${repoSlug}/commits/${branch}?pagelen=10`,
    {
      headers: {
        Authorization: `Basic ${btoa(`${username}:${token}`)}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error('Failed to fetch Bitbucket commits')
  }

  const data = await response.json()
  return data.values || []
}

export async function fetchBitbucketIssues(
  username: string,
  repoSlug: string,
  token: string
): Promise<BitbucketIssue[]> {
  const response = await fetch(
    `https://api.bitbucket.org/2.0/repositories/${username}/${repoSlug}/issues?pagelen=50`,
    {
      headers: {
        Authorization: `Basic ${btoa(`${username}:${token}`)}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error('Failed to fetch Bitbucket issues')
  }

  const data = await response.json()
  return data.values || []
}

export async function fetchBitbucketPRs(
  username: string,
  repoSlug: string,
  token: string
): Promise<BitbucketPR[]> {
  const response = await fetch(
    `https://api.bitbucket.org/2.0/repositories/${username}/${repoSlug}/pullrequests?pagelen=50`,
    {
      headers: {
        Authorization: `Basic ${btoa(`${username}:${token}`)}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error('Failed to fetch Bitbucket pull requests')
  }

  const data = await response.json()
  return data.values || []
}

