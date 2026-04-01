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
