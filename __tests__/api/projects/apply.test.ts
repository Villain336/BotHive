/**
 * @jest-environment node
 */

jest.mock('@octokit/rest', () => ({ Octokit: jest.fn() }));

const mockCreateBranch = jest.fn().mockResolvedValue(undefined);
const mockCreateOrUpdateFile = jest.fn().mockResolvedValue({ sha: 'abc' });
const mockCreatePR = jest.fn().mockResolvedValue({ html_url: 'https://github.com/pr/1', number: 1 });

jest.mock('@/lib/github', () => ({
  parseGitHubUrl: (url: string) => url.includes('github.com') ? { owner: 'o', repo: 'r' } : null,
  createGitHubClient: () => ({}),
  createBranch: (...a: unknown[]) => mockCreateBranch(...a),
  createOrUpdateFile: (...a: unknown[]) => mockCreateOrUpdateFile(...a),
  createPullRequest: (...a: unknown[]) => mockCreatePR(...a),
}));

const mockSingle = jest.fn();

jest.mock('@/lib/supabase-admin', () => ({
  getSupabaseAdmin: () => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'u1' } },
        error: null,
      }),
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({ single: mockSingle }),
          single: mockSingle,
        }),
      }),
    }),
  }),
}));

describe('/api/projects/[projectId]/apply', () => {
  let POST: Function;

  beforeAll(async () => {
    const mod = await import('@/app/api/projects/[projectId]/apply/route');
    POST = mod.POST;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockSingle
      .mockResolvedValueOnce({
        data: { id: 'p1', github_repo_url: 'https://github.com/o/r', github_default_branch: 'main', user_id: 'u1' },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { github_access_token: 'ghp_test' },
        error: null,
      });
  });

  function makeReq(body: Record<string, unknown>) {
    return new Request('http://localhost:3000/api/projects/p1/apply', {
      method: 'POST',
      headers: { authorization: 'Bearer tok', 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  it('creates branch, commits, and returns PR URL', async () => {
    const res = await POST(
      makeReq({ file_path: 'test.ts', content: 'x', commit_message: 'fix' }),
      { params: { projectId: 'p1' } }
    );
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(mockCreateBranch).toHaveBeenCalled();
    expect(mockCreateOrUpdateFile).toHaveBeenCalled();
    expect(mockCreatePR).toHaveBeenCalled();
    expect(json.data.pr_url).toBe('https://github.com/pr/1');
  });

  it('returns 400 for missing file_path', async () => {
    const res = await POST(
      makeReq({ content: 'x' }),
      { params: { projectId: 'p1' } }
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when GitHub not connected', async () => {
    mockSingle.mockReset()
      .mockResolvedValueOnce({ data: { id: 'p1', github_repo_url: 'https://github.com/o/r', github_default_branch: 'main', user_id: 'u1' }, error: null })
      .mockResolvedValueOnce({ data: { github_access_token: null }, error: null });

    const res = await POST(
      makeReq({ file_path: 'x.ts', content: 'x', commit_message: 'fix' }),
      { params: { projectId: 'p1' } }
    );
    expect(res.status).toBe(400);
  });
});
