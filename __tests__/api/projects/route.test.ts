/**
 * @jest-environment node
 */

// Mock all external deps before imports
jest.mock('@octokit/rest', () => ({ Octokit: jest.fn() }));

const mockSelect = jest.fn().mockReturnThis();
const mockEq = jest.fn().mockReturnThis();
const mockOrder = jest.fn();
const mockSingle = jest.fn();
const mockInsert = jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ single: mockSingle }) });

const mockFrom = jest.fn().mockReturnValue({
  select: mockSelect,
  insert: mockInsert,
  eq: mockEq,
  order: mockOrder,
});

const mockGetUser = jest.fn();

jest.mock('@/lib/supabase-admin', () => ({
  getSupabaseAdmin: () => ({
    from: mockFrom,
    auth: { getUser: mockGetUser },
  }),
}));

jest.mock('@/lib/github', () => ({
  parseGitHubUrl: (url: string) => {
    const m = url.match(/github\.com\/([^/]+)\/([^/]+)/);
    return m ? { owner: m[1], repo: m[2] } : null;
  },
}));

describe('/api/projects', () => {
  let GET: Function, POST: Function;

  beforeAll(async () => {
    const mod = await import('@/app/api/projects/route');
    GET = mod.GET;
    POST = mod.POST;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@test.com' } },
      error: null,
    });
  });

  function makeReq(method: string, body?: Record<string, unknown>) {
    const url = 'http://localhost:3000/api/projects';
    const init: RequestInit = { method, headers: { authorization: 'Bearer tok' } };
    if (body) {
      init.body = JSON.stringify(body);
      (init.headers as Record<string, string>)['content-type'] = 'application/json';
    }
    return new Request(url, init);
  }

  describe('GET', () => {
    it('returns projects when authenticated', async () => {
      const projects = [{ id: 'p1', github_repo_name: 'o/r' }];
      mockOrder.mockResolvedValueOnce({ data: projects, error: null });
      const res = await GET(makeReq('GET'));
      const json = await res.json();
      expect(json.data).toEqual(projects);
    });

    it('returns 401 when not authenticated', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: { message: 'no' } });
      const res = await GET(makeReq('GET'));
      expect(res.status).toBe(401);
    });

    it('returns empty array when no projects', async () => {
      mockOrder.mockResolvedValueOnce({ data: [], error: null });
      const res = await GET(makeReq('GET'));
      const json = await res.json();
      expect(json.data).toEqual([]);
    });
  });

  describe('POST', () => {
    it('creates project with valid GitHub URL', async () => {
      mockSingle.mockResolvedValueOnce({ data: { id: 'p1' }, error: null });
      const res = await POST(makeReq('POST', { github_repo_url: 'https://github.com/o/r' }));
      expect(res.status).toBe(201);
    });

    it('returns 400 for missing URL', async () => {
      const res = await POST(makeReq('POST', {}));
      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid GitHub URL', async () => {
      const res = await POST(makeReq('POST', { github_repo_url: 'https://bad.com/x' }));
      expect(res.status).toBe(400);
    });

    it('returns 401 when not authenticated', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: { message: 'no' } });
      const res = await POST(makeReq('POST', { github_repo_url: 'https://github.com/o/r' }));
      expect(res.status).toBe(401);
    });
  });
});
