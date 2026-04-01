/**
 * @jest-environment node
 */

const mockGetUser = jest.fn();
const mockSingle = jest.fn();
const mockCreatePortal = jest.fn();

jest.mock('@/lib/supabase-admin', () => ({
  getSupabaseAdmin: () => ({
    auth: { getUser: mockGetUser },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({ single: mockSingle }),
      }),
    }),
  }),
}));

jest.mock('@/lib/stripe', () => ({
  stripe: {
    billingPortal: { sessions: { create: (...a: unknown[]) => mockCreatePortal(...a) } },
  },
}));

describe('/api/billing/portal', () => {
  let POST: Function;

  beforeAll(async () => {
    const mod = await import('@/app/api/billing/portal/route');
    POST = mod.POST;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
  });

  function makeReq() {
    return new Request('http://localhost:3000/api/billing/portal', {
      method: 'POST',
      headers: { authorization: 'Bearer tok' },
    });
  }

  it('creates portal session with active subscription', async () => {
    mockSingle.mockResolvedValueOnce({ data: { stripe_customer_id: 'cus_1' }, error: null });
    mockCreatePortal.mockResolvedValueOnce({ url: 'https://portal.stripe.com' });
    const res = await POST(makeReq());
    const json = await res.json();
    expect(json.url).toBe('https://portal.stripe.com');
  });

  it('returns 400 when no subscription', async () => {
    mockSingle.mockResolvedValueOnce({ data: { stripe_customer_id: null }, error: null });
    const res = await POST(makeReq());
    expect(res.status).toBe(400);
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: { message: 'no' } });
    const res = await POST(makeReq());
    expect(res.status).toBe(401);
  });
});
