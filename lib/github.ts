import { Octokit } from '@octokit/rest';

export interface RepoFile {
  path: string;
  type: 'file' | 'dir';
  size: number;
  content?: string;
}

export interface RepoTree {
  files: RepoFile[];
  defaultBranch: string;
}

export function createGitHubClient(accessToken: string): Octokit {
  return new Octokit({ auth: accessToken });
}

export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) return null;
  return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
}

export async function getRepoTree(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<RepoTree> {
  const { data: repoData } = await octokit.repos.get({ owner, repo });
  const defaultBranch = repoData.default_branch;

  const { data: tree } = await octokit.git.getTree({
    owner,
    repo,
    tree_sha: defaultBranch,
    recursive: 'true',
  });

  const files: RepoFile[] = (tree.tree || [])
    .filter((item) => item.type === 'blob' || item.type === 'tree')
    .map((item) => ({
      path: item.path || '',
      type: item.type === 'tree' ? 'dir' as const : 'file' as const,
      size: item.size || 0,
    }));

  return { files, defaultBranch };
}

export async function getFileContent(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string,
  ref?: string
): Promise<string | null> {
  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path,
      ref,
    });

    if ('content' in data && data.content) {
      return Buffer.from(data.content, 'base64').toString('utf-8');
    }
    return null;
  } catch {
    return null;
  }
}

export async function getMultipleFiles(
  octokit: Octokit,
  owner: string,
  repo: string,
  paths: string[],
  ref?: string
): Promise<Record<string, string>> {
  const results: Record<string, string> = {};

  await Promise.all(
    paths.map(async (path) => {
      const content = await getFileContent(octokit, owner, repo, path, ref);
      if (content !== null) {
        results[path] = content;
      }
    })
  );

  return results;
}

// --- Write operations ---

export async function createBranch(
  octokit: Octokit,
  owner: string,
  repo: string,
  branchName: string,
  baseBranch: string
): Promise<void> {
  // Get the SHA of the base branch
  const { data: ref } = await octokit.git.getRef({
    owner,
    repo,
    ref: `heads/${baseBranch}`,
  });

  await octokit.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${branchName}`,
    sha: ref.object.sha,
  });
}

export async function createOrUpdateFile(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  branch: string
): Promise<{ sha: string }> {
  // Check if file already exists to get its SHA
  let existingSha: string | undefined;
  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path,
      ref: branch,
    });
    if ('sha' in data) {
      existingSha = data.sha;
    }
  } catch {
    // File doesn't exist yet — that's fine for creation
  }

  const { data } = await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message,
    content: Buffer.from(content).toString('base64'),
    branch,
    sha: existingSha,
  });

  return { sha: data.commit.sha || '' };
}

export async function createPullRequest(
  octokit: Octokit,
  owner: string,
  repo: string,
  title: string,
  body: string,
  head: string,
  base: string
): Promise<{ html_url: string; number: number }> {
  const { data } = await octokit.pulls.create({
    owner,
    repo,
    title,
    body,
    head,
    base,
  });

  return { html_url: data.html_url, number: data.number };
}

export async function searchCode(
  octokit: Octokit,
  owner: string,
  repo: string,
  query: string
): Promise<{ path: string; url: string }[]> {
  try {
    const { data } = await octokit.search.code({
      q: `${query} repo:${owner}/${repo}`,
      per_page: 15,
    });
    return data.items.map((item) => ({
      path: item.path,
      url: item.html_url,
    }));
  } catch {
    return [];
  }
}
