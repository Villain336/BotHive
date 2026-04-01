/**
 * @jest-environment node
 */

jest.mock('@octokit/rest', () => ({ Octokit: jest.fn() }));

const mockSingle = jest.fn();
const mockEq = jest.fn().mockReturnThis();
const mockOrder = jest.fn().mockReturnThis();

jest.mock('@/lib/supabase-admin', () => ({
  getSupabaseAdmin: () => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      }),
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: mockSingle,
            order: mockOrder,
          }),
          order: jest.fn().mockReturnValue({
            eq: mockEq,
          }),
        }),
      }),
    }),
  }),
}));

describe('/api/projects/[projectId]/findings', () => {
  let GET: Function;

  beforeAll(async () => {
    const mod = await import('@/app/api/projects/[projectId]/findings/route');
    GET = mod.GET;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 200 for valid request', async () => {
    // Project ownership check
    mockSingle.mockResolvedValueOnce({ data: { id: 'proj-1' }, error: null });
    // Findings query - the chain ends with the order mock which we can resolve
    mockEq.mockResolvedValueOnce({
      data: [{ id: 'f1', title: 'No tests', severity: 'critical' }],
      error: null,
    });

    const req = new Request('http://localhost:3000/api/projects/proj-1/findings', {
      headers: { authorization: 'Bearer tok' },
    });
    const res = await GET(req, { params: { projectId: 'proj-1' } });
    expect(res.status).toBe(200);
  });
});
